import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/prisma/generated/client'
import PDFDocument from 'pdfkit'

// GET /api/export/rekap-pdf?kogol=...&importId=...
export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
    return Response.json({ success: false, message: 'Tidak terautentikasi.' }, { status: 401 })
  }

  const url            = new URL(request.url)
  const filterKogol    = url.searchParams.get('kogol')?.trim()    ?? ''
  const filterLembar   = url.searchParams.get('lembar')?.trim()   ?? ''
  const filterImportId = url.searchParams.get('importId')?.trim() ?? ''

  let lembarNum:   number | null = null
  let importIdNum: number | null = null

  if (filterLembar !== '') {
    lembarNum = parseInt(filterLembar, 10)
    if (isNaN(lembarNum)) {
      return Response.json({ success: false, message: 'Nilai LEMBAR tidak valid.' }, { status: 400 })
    }
  }

  if (filterImportId !== '') {
    importIdNum = parseInt(filterImportId, 10)
    if (isNaN(importIdNum)) {
      return Response.json({ success: false, message: 'Nilai importId tidak valid.' }, { status: 400 })
    }
  }

  const isKogolMode = filterKogol !== ''
  const ZERO        = new Prisma.Decimal(0)
  const baseWhere: Record<string, unknown> = {
    ...(lembarNum   !== null ? { lembar:   lembarNum   } : {}),
    ...(importIdNum !== null ? { importId: importIdNum } : {}),
  }

  // ── Susun data sesuai mode ────────────────────────────────────
  const fmtNum = (n: number)         => n.toLocaleString('id-ID')
  const fmtRp  = (d: Prisma.Decimal) => Number(d).toLocaleString('id-ID')

  // Mode LEMBAR
  type LembarRow = { unitup:string; l1_plg:number; l1_rp:Prisma.Decimal; l2_plg:number; l2_rp:Prisma.Decimal; l3_plg:number; l3_rp:Prisma.Decimal; tot_plg:number; tot_rp:Prisma.Decimal }
  let lembarRows: LembarRow[] = []
  let totL1Plg=0, totL2Plg=0, totL3Plg=0, totAllPlg=0
  let totL1Rp=ZERO, totL2Rp=ZERO, totL3Rp=ZERO, totAllRp=ZERO
  let showL1=true, showL2=true, showL3=true

  // Mode KOGOL
  type KogolData = { plg:number; rp:Prisma.Decimal }
  type KogolRow  = { unitup:string; kogolMap:Map<string,KogolData>; tot_plg:number; tot_rp:Prisma.Decimal }
  let kogolRows: KogolRow[] = []
  let kogolList: string[]   = []
  let totByKogol = new Map<string,{plg:number;rp:Prisma.Decimal}>()

  if (!isKogolMode) {
    const whereL = { ...baseWhere, ...(lembarNum !== null ? {} : { lembar:{ in:[1,2,3] } }) }
    const grouped = await prisma.customerTunggakan.groupBy({
      by:['unitup','lembar'], where:whereL, _count:{_all:true}, _sum:{rpptl:true},
      orderBy:[{unitup:'asc'},{lembar:'asc'}],
    })
    if (grouped.length === 0) return Response.json({ success:false, message:'Tidak ada data untuk diekspor.' }, { status:404 })

    const rekapMap = new Map<string,{l1_plg:number;l1_rp:Prisma.Decimal;l2_plg:number;l2_rp:Prisma.Decimal;l3_plg:number;l3_rp:Prisma.Decimal}>()
    for (const row of grouped) {
      if (!rekapMap.has(row.unitup)) rekapMap.set(row.unitup, {l1_plg:0,l1_rp:ZERO,l2_plg:0,l2_rp:ZERO,l3_plg:0,l3_rp:ZERO})
      const e=rekapMap.get(row.unitup)!, rp=row._sum.rpptl??ZERO
      if (row.lembar===1) {e.l1_plg=row._count._all; e.l1_rp=rp}
      if (row.lembar===2) {e.l2_plg=row._count._all; e.l2_rp=rp}
      if (row.lembar===3) {e.l3_plg=row._count._all; e.l3_rp=rp}
    }
    lembarRows = Array.from(rekapMap.entries())
      .map(([unitup,v]) => ({ unitup, ...v, tot_plg:v.l1_plg+v.l2_plg+v.l3_plg, tot_rp:v.l1_rp.add(v.l2_rp).add(v.l3_rp) }))
      .sort((a,b) => a.unitup.localeCompare(b.unitup))

    showL1 = lembarNum===null||lembarNum===1
    showL2 = lembarNum===null||lembarNum===2
    showL3 = lembarNum===null||lembarNum===3
    totL1Plg = lembarRows.reduce((s,r)=>s+r.l1_plg,0)
    totL2Plg = lembarRows.reduce((s,r)=>s+r.l2_plg,0)
    totL3Plg = lembarRows.reduce((s,r)=>s+r.l3_plg,0)
    totAllPlg = totL1Plg+totL2Plg+totL3Plg
    totL1Rp  = lembarRows.reduce((s,r)=>s.add(r.l1_rp),ZERO)
    totL2Rp  = lembarRows.reduce((s,r)=>s.add(r.l2_rp),ZERO)
    totL3Rp  = lembarRows.reduce((s,r)=>s.add(r.l3_rp),ZERO)
    totAllRp = totL1Rp.add(totL2Rp).add(totL3Rp)
  } else {
    const allKogolRaw = await prisma.customerTunggakan.findMany({
      distinct:['kogol'], select:{kogol:true}, orderBy:{kogol:'asc'},
      where: importIdNum !== null ? { importId: importIdNum } : {},
    })
    kogolList = allKogolRaw.map((r)=>r.kogol).filter(Boolean)

    const grouped = await prisma.customerTunggakan.groupBy({
      by:['unitup','kogol'], where: baseWhere, _count:{_all:true}, _sum:{rpptl:true},
      orderBy:[{unitup:'asc'},{kogol:'asc'}],
    })
    if (grouped.length === 0) return Response.json({ success:false, message:'Tidak ada data untuk diekspor.' }, { status:404 })

    const rekapMap = new Map<string,Map<string,KogolData>>()
    for (const row of grouped) {
      if (!rekapMap.has(row.unitup)) rekapMap.set(row.unitup, new Map())
      rekapMap.get(row.unitup)!.set(row.kogol, {plg:row._count._all, rp:row._sum.rpptl??ZERO})
    }
    kogolRows = Array.from(rekapMap.entries())
      .map(([unitup,kogolMap]) => {
        let tot_plg=0, tot_rp=ZERO
        for (const {plg,rp} of kogolMap.values()) { tot_plg+=plg; tot_rp=tot_rp.add(rp) }
        return {unitup, kogolMap, tot_plg, tot_rp}
      })
      .sort((a,b)=>a.unitup.localeCompare(b.unitup))

    for (const kogol of kogolList) {
      let plg=0, rp=ZERO
      for (const row of kogolRows) { const k=row.kogolMap.get(kogol); if(k){plg+=k.plg;rp=rp.add(k.rp)} }
      totByKogol.set(kogol, {plg,rp})
    }
    totAllPlg = kogolRows.reduce((s,r)=>s+r.tot_plg,0)
    totAllRp  = kogolRows.reduce((s,r)=>s.add(r.tot_rp),ZERO)
  }

  const activeRows = isKogolMode ? kogolRows : lembarRows

  // ── Bangun PDF ───────────────────────────────────────────────
  const doc = new PDFDocument({ size:'A4', layout:'landscape', margin:30 })
  const chunks: Uint8Array[] = []
  doc.on('data', (chunk: Uint8Array) => chunks.push(chunk))

  const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    doc.on('end',   () => resolve(Buffer.concat(chunks as Buffer[])))
    doc.on('error', reject)

    const pageW=841.89, margin=30, usableW=pageW-margin*2
    const colNo=28, colUnit=140

    // Hitung jumlah kolom data
    const activeLembarCount = (showL1?1:0)+(showL2?1:0)+(showL3?1:0)
    const dataCols = isKogolMode ? kogolList.length*2+2 : activeLembarCount*2+2
    const dataW = (usableW-colNo-colUnit)/dataCols

    type ColDef = {x:number;w:number;align:'left'|'center'|'right'}
    const cols: ColDef[] = []
    let cx = margin
    cols.push({x:cx,w:colNo,align:'center'}); cx+=colNo
    cols.push({x:cx,w:colUnit,align:'left'}); cx+=colUnit
    for (let i=0; i<dataCols; i++) {
      const w=Math.round(dataW); cols.push({x:cx,w,align:'right'}); cx+=w
    }

    const rowH=16,hdr1H=18,hdr2H=14
    const COLOR_H1='#1D4ED8',COLOR_H2='#2563EB',COLOR_TOT='#EFF6FF',COLOR_ALT='#F8FAFC'
    const FSH=8, FS=7.5

    doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827')
       .text('Rekap Tunggakan', margin, margin, {align:'center',width:usableW})
    const subtitleParts: string[] = []
    if (filterImportId) subtitleParts.push(`Import #${filterImportId}`)
    if (filterKogol)    subtitleParts.push(`Golongan: ${filterKogol}`)
    if (filterLembar)   subtitleParts.push(`Lembar: ${filterLembar}`)
    doc.font('Helvetica').fontSize(8).fillColor('#6B7280')
       .text(subtitleParts.length ? subtitleParts.join('  ·  ') : 'Semua data', margin, margin+16, {align:'center',width:usableW})
    const now = new Date().toLocaleString('id-ID',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})
    doc.font('Helvetica').fontSize(7).fillColor('#9CA3AF')
       .text(`Dicetak: ${now}`, margin, margin+2, {align:'right',width:usableW})

    let y = margin+36

    function drawCell(ci:number, rowY:number, height:number, text:string,
      opts:{bg?:string;textColor?:string;bold?:boolean;fontSize?:number;align?:'left'|'center'|'right'}={}
    ) {
      const col=cols[ci]; if(!col) return
      const {bg,textColor='#111827',bold=false,fontSize=FS,align=col.align}=opts
      if(bg) doc.rect(col.x,rowY,col.w,height).fillColor(bg).fill()
      doc.rect(col.x,rowY,col.w,height).strokeColor('#CBD5E1').lineWidth(0.3).stroke()
      const padX=4, textY=rowY+(height-fontSize)/2-1
      doc.font(bold?'Helvetica-Bold':'Helvetica').fontSize(fontSize).fillColor(textColor)
         .text(text,col.x+padX,textY,{width:col.w-padX*2,height,align,ellipsis:true,lineBreak:false})
    }

    function groupLabel(startCol:number, span:number, label:string, rowY:number, height:number, bg:string) {
      const c0=cols[startCol],cN=cols[startCol+span-1]; if(!c0||!cN) return
      const mergedW=(cN.x+cN.w)-c0.x
      doc.rect(c0.x,rowY,mergedW,height).fillColor(bg).fill()
      doc.rect(c0.x,rowY,mergedW,height).strokeColor('#93C5FD').lineWidth(0.3).stroke()
      doc.font('Helvetica-Bold').fontSize(FSH).fillColor('#FFF')
         .text(label,c0.x+2,rowY+(height-FSH)/2-1,{width:mergedW-4,align:'center',lineBreak:false})
    }

    // Header row 1
    drawCell(0,y,hdr1H+hdr2H,'NO',{bg:COLOR_H1,textColor:'#FFF',bold:true,fontSize:FSH,align:'center'})
    drawCell(1,y,hdr1H+hdr2H,'UNIT LAYANAN',{bg:COLOR_H1,textColor:'#FFF',bold:true,fontSize:FSH,align:'left'})

    let hci=2
    if (!isKogolMode) {
      if (showL1) { groupLabel(hci,2,'1 LEMBAR',y,hdr1H,COLOR_H1); hci+=2 }
      if (showL2) { groupLabel(hci,2,'2 LEMBAR',y,hdr1H,COLOR_H1); hci+=2 }
      if (showL3) { groupLabel(hci,2,'3 LEMBAR',y,hdr1H,COLOR_H1); hci+=2 }
    } else {
      for (const kogol of kogolList) { groupLabel(hci,2,`KOGOL ${kogol}`,y,hdr1H,COLOR_H1); hci+=2 }
    }
    groupLabel(hci,2,'TOTAL',y,hdr1H,COLOR_H1)

    // Header row 2
    const y2=y+hdr1H; let hci2=2
    const totalGroups = isKogolMode ? kogolList.length+1 : activeLembarCount+1
    for (let i=0; i<totalGroups; i++) {
      drawCell(hci2,  y2,hdr2H,'PLG',  {bg:COLOR_H2,textColor:'#FFF',bold:true,fontSize:FSH-0.5,align:'right'})
      drawCell(hci2+1,y2,hdr2H,'RPPTL',{bg:COLOR_H2,textColor:'#FFF',bold:true,fontSize:FSH-0.5,align:'right'})
      hci2+=2
    }
    y=y2+hdr2H

    // Baris data
    activeRows.forEach((row:LembarRow|KogolRow, idx:number) => {
      if (y+rowH > doc.page.height-margin-20) {
        doc.addPage({size:'A4',layout:'landscape',margin:30}); y=margin
      }
      const bg = idx%2===1 ? COLOR_ALT : undefined
      let ci=0
      drawCell(ci++,y,rowH,String(idx+1),{bg,align:'center'})
      drawCell(ci++,y,rowH,(row as LembarRow).unitup||'—',{bg})

      if (!isKogolMode) {
        const r = row as LembarRow
        if (showL1) { drawCell(ci++,y,rowH,fmtNum(r.l1_plg),{bg,align:'right'}); drawCell(ci++,y,rowH,fmtRp(r.l1_rp),{bg,align:'right'}) }
        if (showL2) { drawCell(ci++,y,rowH,fmtNum(r.l2_plg),{bg,align:'right'}); drawCell(ci++,y,rowH,fmtRp(r.l2_rp),{bg,align:'right'}) }
        if (showL3) { drawCell(ci++,y,rowH,fmtNum(r.l3_plg),{bg,align:'right'}); drawCell(ci++,y,rowH,fmtRp(r.l3_rp),{bg,align:'right'}) }
      } else {
        const r = row as KogolRow
        for (const kogol of kogolList) {
          const k=r.kogolMap.get(kogol)
          drawCell(ci++,y,rowH,k?fmtNum(k.plg):'0',{bg,align:'right'})
          drawCell(ci++,y,rowH,k?fmtRp(k.rp):'0',{bg,align:'right'})
        }
      }
      drawCell(ci++,y,rowH,fmtNum((row as LembarRow).tot_plg??0),{bg,bold:true,align:'right'})
      drawCell(ci,  y,rowH,fmtRp((row as LembarRow).tot_rp??ZERO),{bg,bold:true,align:'right'})
      y+=rowH
    })

    // Baris Total UP3
    if (y+rowH > doc.page.height-margin-20) { doc.addPage({size:'A4',layout:'landscape',margin:30}); y=margin }
    let ti=0
    drawCell(ti++,y,rowH,'—',        {bg:COLOR_TOT,align:'center',textColor:'#6B7280'})
    drawCell(ti++,y,rowH,'Total UP3',{bg:COLOR_TOT,bold:true,textColor:'#1E40AF'})
    if (!isKogolMode) {
      if (showL1) { drawCell(ti++,y,rowH,fmtNum(totL1Plg),{bg:COLOR_TOT,bold:true,textColor:'#1E40AF',align:'right'}); drawCell(ti++,y,rowH,fmtRp(totL1Rp),{bg:COLOR_TOT,bold:true,textColor:'#1E40AF',align:'right'}) }
      if (showL2) { drawCell(ti++,y,rowH,fmtNum(totL2Plg),{bg:COLOR_TOT,bold:true,textColor:'#1E40AF',align:'right'}); drawCell(ti++,y,rowH,fmtRp(totL2Rp),{bg:COLOR_TOT,bold:true,textColor:'#1E40AF',align:'right'}) }
      if (showL3) { drawCell(ti++,y,rowH,fmtNum(totL3Plg),{bg:COLOR_TOT,bold:true,textColor:'#1E40AF',align:'right'}); drawCell(ti++,y,rowH,fmtRp(totL3Rp),{bg:COLOR_TOT,bold:true,textColor:'#1E40AF',align:'right'}) }
    } else {
      for (const kogol of kogolList) {
        const t=totByKogol.get(kogol)!
        drawCell(ti++,y,rowH,fmtNum(t.plg),{bg:COLOR_TOT,bold:true,textColor:'#1E40AF',align:'right'})
        drawCell(ti++,y,rowH,fmtRp(t.rp),  {bg:COLOR_TOT,bold:true,textColor:'#1E40AF',align:'right'})
      }
    }
    drawCell(ti++,y,rowH,fmtNum(totAllPlg),{bg:COLOR_TOT,bold:true,textColor:'#1E3A8A',align:'right'})
    drawCell(ti,  y,rowH,fmtRp(totAllRp),  {bg:COLOR_TOT,bold:true,textColor:'#1E3A8A',align:'right'})

    doc.end()
  })

  const parts = ['rekap-tunggakan']
  if (filterImportId) parts.push(`import-${filterImportId}`)
  if (filterKogol)    parts.push(`kogol-${filterKogol}`)
  if (filterLembar)   parts.push(`lembar-${filterLembar}`)

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${parts.join('-')}.pdf"`,
      'Cache-Control':       'no-store',
    },
  })
}

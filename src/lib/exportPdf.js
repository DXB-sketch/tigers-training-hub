export async function exportSessionPdf(planTitle, containerElement) {
  const jsPDF = (await import('jspdf')).default
  const html2canvas = (await import('html2canvas')).default

  const drillSheets = containerElement.querySelectorAll('.drill-page')

  if (drillSheets.length === 0) return

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  const pageWidth = 210   // A4 width in mm
  const pageHeight = 297  // A4 height in mm
  const margin = 10       // mm on each side

  for (let i = 0; i < drillSheets.length; i++) {
    const canvas = await html2canvas(drillSheets[i], {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.92)

    const availableWidth = pageWidth - margin * 2
    const availableHeight = pageHeight - margin * 2
    const canvasAspect = canvas.height / canvas.width

    let imgWidth = availableWidth
    let imgHeight = imgWidth * canvasAspect

    if (imgHeight > availableHeight) {
      imgHeight = availableHeight
      imgWidth = imgHeight / canvasAspect
    }

    const xOffset = margin + (availableWidth - imgWidth) / 2

    if (i > 0) pdf.addPage()

    pdf.addImage(imgData, 'JPEG', xOffset, margin, imgWidth, imgHeight)
  }

  const fileName = planTitle
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  pdf.save(`${fileName}-session.pdf`)
}

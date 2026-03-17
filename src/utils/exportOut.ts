import JSZip from 'jszip'

export async function writeBundleToFolder(
  companyDir: FileSystemDirectoryHandle,
  bundle: Record<string, Blob>
) {
  for (const [fname, blob] of Object.entries(bundle)) {
    const fileHandle = await companyDir.getFileHandle(fname, { create: true })
    const ws = await fileHandle.createWritable()
    await ws.write(blob)
    await ws.close()
  }
}

async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function shareOrDownloadZip(
  bundle: Record<string, Blob>,
  zipName: string
) {
  const zip = new JSZip()
  for (const [name, blob] of Object.entries(bundle)) {
    zip.file(name, blob)
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' })

  const file = new File([zipBlob], zipName, { type: 'application/zip' })

  // iOS/Android: Share Sheet ha tud file-t
  const navAny = navigator as any
  if (navigator.share && navAny.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: zipName })
    return
  }

  // fallback: sima letöltés
  await downloadBlob(zipBlob, zipName)
}
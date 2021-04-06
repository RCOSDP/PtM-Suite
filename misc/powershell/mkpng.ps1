$ppt = New-Object -ComObject PowerPoint.Application
$location = [String](Get-Location)
$pres = $ppt.Presentations.Open($location + "\sample.pptx",$True,$True,$False)
$pres.SaveAs($location + "\png", [Microsoft.Office.Interop.PowerPoint.PpSaveAsFileType]::PpSaveAsPNG)
$pres.Close()
$ppt.Quit()

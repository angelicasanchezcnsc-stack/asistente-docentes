# Reconocimiento de texto (OCR) de una imagen con el motor que trae Windows, en español.
#
# Sirve para transcribir resoluciones escaneadas, como la Resolución MEN 003842 de 2022, sin
# instalar programas ni enviar el documento a internet. El resultado es un borrador: hay que
# cotejarlo con la imagen antes de usarlo.
#
# Uso (una página a la vez; las páginas del PDF se convierten antes a PNG, por ejemplo con
# PyMuPDF: pymupdf.open(pdf)[n].get_pixmap(dpi=110).save("p01.png")):
#   powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\ocr_windows.ps1 "C:\ruta\p01.png" > p01.txt
param([Parameter(Mandatory = $true)][string]$Imagen)

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics, ContentType = WindowsRuntime]
$null = [Windows.Globalization.Language, Windows.Globalization, ContentType = WindowsRuntime]

$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
  })[0]
function Esperar($operacion, [Type]$tipo) {
  $tarea = $asTask.MakeGenericMethod($tipo).Invoke($null, @($operacion))
  $tarea.Wait()
  $tarea.Result
}

$ruta = (Resolve-Path $Imagen).Path
$archivo = Esperar ([Windows.Storage.StorageFile]::GetFileFromPathAsync($ruta)) ([Windows.Storage.StorageFile])
$flujo = Esperar ($archivo.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
$decodificador = Esperar ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($flujo)) ([Windows.Graphics.Imaging.BitmapDecoder])
$mapa = Esperar ($decodificador.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
$motor = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('es-ES'))
if ($null -eq $motor) { throw 'Windows no tiene instalado el reconocimiento de texto en español (es-ES).' }
$resultado = Esperar ($motor.RecognizeAsync($mapa)) ([Windows.Media.Ocr.OcrResult])

[Console]::OutputEncoding = [Text.Encoding]::UTF8
$resultado.Lines | ForEach-Object { $_.Text }

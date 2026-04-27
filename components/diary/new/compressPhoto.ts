/**
 * compressPhoto — comprime foto antes da validação de tamanho.
 *
 * Parâmetros: 1568px / 88% JPEG.
 *
 * Por que esses números (atualizado 2026-04-27):
 *  - 1568px: recomendação oficial da Anthropic Vision API. Não há ganho de
 *    qualidade visual além disso e a API não cobra a mais.
 *  - 88% quality: subida de 78%→88% pra preservar detalhes finos como pelagem
 *    de cães braquicefálicos (Shih Tzu, Pug) onde 78% gerava blocos JPEG
 *    visíveis. A foto passa por DUPLA compressão (aqui na seleção +
 *    runUploads.ts ao subir pro storage), então cada passada precisa preservar
 *    margem suficiente. O custo extra de tamanho é insignificante (~30%) frente
 *    ao ganho perceptivo. Elite > economia de bytes.
 *
 * Fallback: se ImageManipulator falhar, retorna o URI original.
 */

export async function compressPhoto(uri: string): Promise<{ uri: string; size?: number }> {
  try {
    const ImageManipulator = require('expo-image-manipulator');
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1568 } }],
      { compress: 0.88, format: ImageManipulator.SaveFormat.JPEG },
    );
    return { uri: result.uri };
  } catch {
    return { uri };
  }
}

const { withAndroidManifest, createRunOncePlugin } = require('@expo/config-plugins');

const TOOLS_NAMESPACE = 'http://schemas.android.com/tools';

// Permissões de acesso a fotos e vídeos sinalizadas pela política do Google Play.
// O app só precisa de acesso único/pouco frequente à mídia (anexar um arquivo na
// conversa), então usamos o seletor de fotos do Android (react-native-image-picker
// v7 já usa o Photo Picker, sem permissão) e o seletor de documentos. Essas
// permissões não devem aparecer no manifesto final.
const MEDIA_PERMISSIONS = [
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
];

/**
 * Remove as permissões READ_MEDIA_IMAGES / READ_MEDIA_VIDEO do AndroidManifest.xml
 * gerado (merged manifest), para cumprir a Política de permissões de acesso a fotos
 * e vídeos do Google Play.
 *
 * Mesmo que nenhuma dependência atual injete essas permissões, declaramos
 * tools:node="remove" para garantir que elas nunca apareçam no APK/AAB, mesmo que
 * uma futura biblioteca tente adicioná-las.
 */
function withRemoveMediaPermissions(config) {
  return withAndroidManifest(config, cfg => {
    const manifest = cfg.modResults.manifest;

    // Garante o namespace tools no elemento <manifest>.
    manifest.$ = manifest.$ || {};
    manifest.$['xmlns:tools'] = manifest.$['xmlns:tools'] || TOOLS_NAMESPACE;

    manifest['uses-permission'] = manifest['uses-permission'] || [];

    // Remove qualquer declaração existente das permissões para evitar duplicatas.
    manifest['uses-permission'] = manifest['uses-permission'].filter(
      perm => !MEDIA_PERMISSIONS.includes(perm.$?.['android:name']),
    );

    // Adiciona cada permissão com tools:node="remove".
    for (const permission of MEDIA_PERMISSIONS) {
      manifest['uses-permission'].push({
        $: {
          'android:name': permission,
          'tools:node': 'remove',
        },
      });
    }

    return cfg;
  });
}

module.exports = createRunOncePlugin(
  withRemoveMediaPermissions,
  'with-remove-media-permissions',
  '1.0.0',
);

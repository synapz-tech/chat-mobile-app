const { withAndroidManifest, createRunOncePlugin } = require('@expo/config-plugins');

const AD_ID_PERMISSION = 'com.google.android.gms.permission.AD_ID';
const TOOLS_NAMESPACE = 'http://schemas.android.com/tools';

/**
 * Remove a permissão com.google.android.gms.permission.AD_ID do AndroidManifest.xml gerado.
 *
 * Essa permissão é injetada automaticamente por SDKs do Firebase/Google Play Services
 * (ex.: play-services-measurement via @react-native-firebase). Para excluí-la do
 * manifesto mesclado (merged manifest) do APK/AAB, declaramos a permissão com
 * tools:node="remove", que instrui o Android Manifest Merger a removê-la.
 */
function withRemoveAdIdPermission(config) {
  return withAndroidManifest(config, cfg => {
    const manifest = cfg.modResults.manifest;

    // Garante o namespace tools no elemento <manifest>.
    manifest.$ = manifest.$ || {};
    manifest.$['xmlns:tools'] = manifest.$['xmlns:tools'] || TOOLS_NAMESPACE;

    manifest['uses-permission'] = manifest['uses-permission'] || [];

    // Remove qualquer declaração existente da permissão para evitar duplicatas.
    manifest['uses-permission'] = manifest['uses-permission'].filter(
      perm => perm.$?.['android:name'] !== AD_ID_PERMISSION,
    );

    // Adiciona a declaração com tools:node="remove".
    manifest['uses-permission'].push({
      $: {
        'android:name': AD_ID_PERMISSION,
        'tools:node': 'remove',
      },
    });

    return cfg;
  });
}

module.exports = createRunOncePlugin(
  withRemoveAdIdPermission,
  'with-remove-ad-id-permission',
  '1.0.0',
);

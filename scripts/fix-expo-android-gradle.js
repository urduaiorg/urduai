const fs = require('fs');
const path = require('path');

const root = process.cwd();

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeIfChanged(filePath, next) {
  const prev = read(filePath);
  if (prev !== next) {
    fs.writeFileSync(filePath, next);
    console.log(`patched ${path.relative(root, filePath)}`);
  }
}

function patchExpoModuleBuildGradle(relativePath, extraPlugins = []) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) return;

  const pluginLines = extraPlugins.map((plugin) => `apply plugin: '${plugin}'`).join('\n');
  const replacement = [
    "apply plugin: 'com.android.library'",
    pluginLines,
    '',
    "def expoModulesCorePlugin = new File(project(':expo-modules-core').projectDir.absolutePath, 'ExpoModulesCorePlugin.gradle')",
    'apply from: expoModulesCorePlugin',
    'applyKotlinExpoModulesCorePlugin()',
    'useCoreDependencies()',
    'useDefaultAndroidSdkVersions()',
    'useExpoPublishing()',
  ].filter(Boolean).join('\n');

  const current = read(filePath);
  if (current.includes('useCoreDependencies()')) return;

  const next = current.replace(/plugins\s*\{[\s\S]*?\}\s*/, `${replacement}\n\n`);
  writeIfChanged(filePath, next);
}

function patchExpoModulesCorePlugin() {
  const filePath = path.join(root, 'node_modules/expo-modules-core/android/ExpoModulesCorePlugin.gradle');
  if (!fs.existsSync(filePath)) return;

  const current = read(filePath);
  if (current.includes('def releaseComponent = components.findByName("release")')) return;

  const target = `  project.afterEvaluate {
    publishing {
      publications {
        release(MavenPublication) {
          from components.release
        }
      }
      repositories {
        maven {
          url = mavenLocal().url
        }
      }
    }
  }
}`;

  const replacement = `  project.afterEvaluate {
    def releaseComponent = components.findByName("release")
    if (releaseComponent == null) {
      return
    }

    publishing {
      publications {
        release(MavenPublication) {
          from releaseComponent
        }
      }
      repositories {
        maven {
          url = mavenLocal().url
        }
      }
    }
  }
}`;

  writeIfChanged(filePath, current.replace(target, replacement));
}

[
  ['node_modules/expo-application/android/build.gradle'],
  ['node_modules/expo-device/android/build.gradle'],
  ['node_modules/expo-file-system/android/build.gradle'],
  ['node_modules/expo-localization/android/build.gradle'],
  ['node_modules/expo-network/android/build.gradle'],
  ['node_modules/expo-screen-orientation/android/build.gradle'],
  ['node_modules/expo-store-review/android/build.gradle'],
  ['node_modules/expo-notifications/node_modules/expo-constants/android/build.gradle'],
  ['node_modules/expo-notifications/android/build.gradle', ['kotlin-parcelize']],
].forEach(([file, extras]) => patchExpoModuleBuildGradle(file, extras));

patchExpoModulesCorePlugin();

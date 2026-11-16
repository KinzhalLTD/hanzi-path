// Hanzi Path – native shell. Loads the bundled web app from a local file and hands it to the bridge.
import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Asset } from 'expo-asset';
import * as SplashScreen from 'expo-splash-screen';
import HanziBridge from './src/HanziBridge';

SplashScreen.preventAutoHideAsync().catch(() => {});

const WEB_APP = require('./assets/web/hanzi-path.html');

export default function App() {
  const [uri, setUri] = useState(null);
  const [failed, setFailed] = useState(false);

  const load = async () => {
    setFailed(false);
    try {
      const asset = Asset.fromModule(WEB_APP);
      await asset.downloadAsync();            // release builds: file already inside the app bundle
      setUri(asset.localUri || asset.uri);
    } catch {
      setFailed(true);
      SplashScreen.hideAsync().catch(() => {});
    }
  };
  useEffect(() => { load(); }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {uri ? (
        <HanziBridge uri={uri} onReady={() => SplashScreen.hideAsync().catch(() => {})} />
      ) : failed ? (
        <View style={styles.center}>
          <Text style={styles.msg}>تعذّر فتح التطبيق · Could not open the app</Text>
          <Pressable onPress={load} style={styles.btn}><Text style={styles.btnT}>إعادة المحاولة · Try again</Text></Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0908' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  msg: { color: '#f3e9dc', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  btn: { backgroundColor: '#c8102e', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  btnT: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

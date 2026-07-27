import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.brand}>XHS</Text>
        <Text style={styles.title}>小红书移动端</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>客户端骨架已就绪</Text>
        <Text style={styles.panelText}>从这里开始搭建推荐流、发布和个人页。</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff7f7',
    padding: 24,
  },
  header: {
    gap: 8,
    paddingTop: 48,
    paddingBottom: 32,
  },
  brand: {
    color: '#ff2442',
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    color: '#1f1f1f',
    fontSize: 28,
    fontWeight: '700',
  },
  panel: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    gap: 8,
    padding: 20,
  },
  panelTitle: {
    color: '#1f1f1f',
    fontSize: 18,
    fontWeight: '700',
  },
  panelText: {
    color: '#5f6368',
    fontSize: 15,
    lineHeight: 22,
  },
});

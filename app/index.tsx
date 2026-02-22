import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Text,
  View,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Animated,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import * as Clipboard from "expo-clipboard";

const { width, height } = Dimensions.get("window");

const BOOK_MAP: Record<number, string> = {
  1: "Genesis",
  2: "Exodus",
  3: "Leviticus",
  4: "Numbers",
  5: "Deuteronomy",
  6: "Joshua",
  7: "Judges",
  8: "Ruth",
  9: "1 Samuel",
  10: "2 Samuel",
  11: "1 Kings",
  12: "2 Kings",
  13: "1 Chronicles",
  14: "2 Chronicles",
  15: "Ezra",
  16: "Nehemiah",
  17: "Esther",
  18: "Job",
  19: "Psalms",
  20: "Proverbs",
  21: "Ecclesiastes",
  22: "Song of Solomon",
  23: "Isaiah",
  24: "Jeremiah",
  25: "Lamentations",
  26: "Ezekiel",
  27: "Daniel",
  28: "Hosea",
  29: "Joel",
  30: "Amos",
  31: "Obadiah",
  32: "Jonah",
  33: "Micah",
  34: "Nahum",
  35: "Habakkuk",
  36: "Zephaniah",
  37: "Haggai",
  38: "Zechariah",
  39: "Malachi",
  40: "Matthew",
  41: "Mark",
  42: "Luke",
  43: "John",
  44: "Acts",
  45: "Romans",
  46: "1 Corinthians",
  47: "2 Corinthians",
  48: "Galatians",
  49: "Ephesians",
  50: "Philippians",
  51: "Colossians",
  52: "1 Thessalonians",
  53: "2 Thessalonians",
  54: "1 Timothy",
  55: "2 Timothy",
  56: "Titus",
  57: "Philemon",
  58: "Hebrews",
  59: "James",
  60: "1 Peter",
  61: "2 Peter",
  62: "1 John",
  63: "2 John",
  64: "3 John",
  65: "Jude",
  66: "Revelation",
};

export default function Index() {
  const { colors, dark } = useTheme();
  const db = useSQLiteContext();
  const listRef = useRef<FlatList>(null);

  const [verses, setVerses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBookId, setCurrentBookId] = useState(1);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [maxChapter, setMaxChapter] = useState(1);
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);

  const [menuVisible, setMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [step, setStep] = useState<"book" | "chapter" | "verse">("book");
  const [tempBook, setTempBook] = useState<number>(1);
  const [tempChapter, setTempChapter] = useState<number>(1);
  const [tempMaxCh, setTempMaxCh] = useState(0);
  const [tempMaxVs, setTempMaxVs] = useState(0);

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    verse: any;
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const chRes = await db.getFirstAsync<{ maxCh: number }>(
        "SELECT MAX(chapter) as maxCh FROM verses WHERE book = ?",
        [currentBookId],
      );
      if (chRes) setMaxChapter(chRes.maxCh);
      const res = await db.getAllAsync(
        "SELECT id, verse, text FROM verses WHERE book = ? AND chapter = ? ORDER BY verse ASC",
        [currentBookId, currentChapter],
      );
      setVerses(res);
      setLoading(false);
    }
    loadData();
  }, [currentBookId, currentChapter]);

  const handleSelection = (bookId: number, ch: number, vs?: number) => {
    setCurrentBookId(bookId);
    setCurrentChapter(ch);
    setMenuVisible(false);
    setStep("book");
    setSearchQuery("");
    if (vs) {
      setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: vs - 1,
          animated: true,
          viewPosition: 0,
        });
        setHighlightedVerse(vs);
        setTimeout(() => setHighlightedVerse(null), 2000);
      }, 500);
    }
  };

  const filteredBooks = useMemo(() => {
    const cleanQuery = searchQuery.toLowerCase().replace(/\s/g, "");
    return Object.entries(BOOK_MAP).filter(([_, name]) =>
      name.toLowerCase().replace(/\s/g, "").includes(cleanQuery),
    );
  }, [searchQuery]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: `${BOOK_MAP[currentBookId]} ${currentChapter}: 1-${verses.length}`,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text, fontFamily: "NotoSans" },
          headerRight: () => (
            <View style={styles.headerRow}>
              <Pressable
                onPress={() =>
                  currentChapter > 1 && setCurrentChapter((c) => c - 1)
                }
                style={styles.navBtn}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={currentChapter === 1 ? "#666" : colors.text}
                />
              </Pressable>
              <Pressable
                onPress={() =>
                  currentChapter < maxChapter && setCurrentChapter((c) => c + 1)
                }
                style={styles.navBtn}
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={currentChapter === maxChapter ? "#666" : colors.text}
                />
              </Pressable>
              <Pressable
                onPress={() => setMenuVisible(true)}
                style={styles.navBtn}
              >
                <Ionicons name="search" size={24} color={colors.text} />
              </Pressable>
            </View>
          ),
        }}
      />

      <FlatList
        ref={listRef}
        data={verses}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Animated.View
            style={[
              styles.verseBox,
              highlightedVerse === item.verse && {
                backgroundColor: dark ? "#222" : "#f0f0f0",
                borderRadius: 8,
              },
            ]}
          >
            <Pressable
              onLongPress={(e) => {
                Keyboard.dismiss();
                setContextMenu({
                  visible: true,
                  x: Math.min(e.nativeEvent.pageX, width - 180),
                  y: e.nativeEvent.pageY,
                  verse: item,
                });
              }}
              delayLongPress={600}
            >
              <Text
                selectable
                selectionColor={colors.primary}
                style={[styles.verseText, { color: colors.text }]}
              >
                <Text style={styles.verseNum}>{item.verse} </Text>
                {item.text
                  .replace(/¶/g, "")
                  .split(/(\[.*?\])/g)
                  .map((part: any, i: any) => (
                    <Text
                      key={i}
                      style={part.startsWith("[") ? styles.italicText : null}
                    >
                      {part.startsWith("[") ? part.slice(1, -1) : part}
                    </Text>
                  ))}
              </Text>
            </Pressable>
          </Animated.View>
        )}
      />

      {/* FULL SCREEN SEARCH / NAVIGATION MENU */}
      <Modal
        visible={menuVisible}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => setMenuVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.modalFull, { backgroundColor: colors.background }]}
        >
          <View
            style={[
              styles.modalTopNav,
              { borderBottomColor: dark ? "#333" : "#eee" },
            ]}
          >
            {step !== "book" && (
              <Pressable
                onPress={() => setStep(step === "verse" ? "chapter" : "book")}
                style={styles.backBtn}
              >
                <Ionicons name="arrow-back" size={26} color={colors.text} />
              </Pressable>
            )}
            <Text
              style={[styles.modalTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {step === "book"
                ? "Books"
                : step === "chapter"
                  ? BOOK_MAP[tempBook]
                  : `${BOOK_MAP[tempBook]} ${tempChapter}`}
            </Text>
            <Pressable
              onPress={() => {
                setMenuVisible(false);
                setStep("book");
              }}
            >
              <Ionicons name="close" size={28} color={colors.text} />
            </Pressable>
          </View>

          {step === "book" && (
            <View style={styles.searchContainer}>
              <Ionicons
                name="search-outline"
                size={20}
                color="#888"
                style={styles.searchIcon}
              />
              <TextInput
                placeholder="Find book (e.g. 1john)"
                placeholderTextColor="#888"
                style={[
                  styles.searchBar,
                  { color: colors.text, borderColor: dark ? "#444" : "#ccc" },
                ]}
                onChangeText={setSearchQuery}
                value={searchQuery}
                autoComplete="off"
                textContentType="none"
                importantForAutofill="no"
                autoCorrect={false}
                autoFocus
              />
            </View>
          )}

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {step === "book" &&
              filteredBooks.map(([id, name]) => (
                <Pressable
                  key={id}
                  style={[
                    styles.bookRow,
                    { borderBottomColor: dark ? "#222" : "#f9f9f9" },
                  ]}
                  onPress={async () => {
                    setTempBook(Number(id));
                    const res = await db.getFirstAsync<{ maxCh: number }>(
                      "SELECT MAX(chapter) as maxCh FROM verses WHERE book = ?",
                      [id],
                    );
                    setTempMaxCh(res?.maxCh || 1);
                    setStep("chapter");
                    Keyboard.dismiss();
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 18 }}>
                    {name}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </Pressable>
              ))}

            {(step === "chapter" || step === "verse") && (
              <View style={styles.gridContainer}>
                {Array.from(
                  { length: step === "chapter" ? tempMaxCh : tempMaxVs },
                  (_, i) => i + 1,
                ).map((n) => (
                  <Pressable
                    key={n}
                    style={[
                      styles.gridCard,
                      { backgroundColor: dark ? "#1a1a1a" : "#f7f7f7" },
                    ]}
                    onPress={async () => {
                      if (step === "chapter") {
                        setTempChapter(n);
                        const res = await db.getFirstAsync<{ maxVs: number }>(
                          "SELECT MAX(verse) as maxVs FROM verses WHERE book = ? AND chapter = ?",
                          [tempBook, n],
                        );
                        setTempMaxVs(res?.maxVs || 1);
                        setStep("verse");
                      } else {
                        handleSelection(tempBook, tempChapter, n);
                      }
                    }}
                  >
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 16,
                        fontWeight: "bold",
                      }}
                    >
                      {n}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* CUSTOM CONTEXT MENU */}
      {contextMenu?.visible && (
        <Modal transparent visible animationType="fade">
          <Pressable
            style={styles.overlay}
            onPress={() => setContextMenu(null)}
          >
            <View
              style={[
                styles.contextMenu,
                {
                  top: contextMenu.y,
                  left: contextMenu.x,
                  backgroundColor: dark ? "#333" : "#fff",
                },
              ]}
            >
              <Pressable
                style={styles.contextItem}
                onPress={async () => {
                  await Clipboard.setStringAsync(
                    `${BOOK_MAP[currentBookId]} ${currentChapter}:${contextMenu.verse.verse}\n${contextMenu.verse.text.replace(/¶/g, "")}`,
                  );
                  setContextMenu(null);
                }}
              >
                <Ionicons name="copy-outline" size={20} color={colors.text} />
                <Text
                  style={{
                    color: colors.text,
                    marginLeft: 12,
                    fontWeight: "500",
                  }}
                >
                  Copy Verse
                </Text>
              </Pressable>
              <View
                style={[
                  styles.separator,
                  { backgroundColor: dark ? "#444" : "#eee" },
                ]}
              />
              <Pressable
                style={styles.contextItem}
                onPress={() => setContextMenu(null)}
              >
                <Ionicons name="text-outline" size={20} color={colors.text} />
                <Text
                  style={{
                    color: colors.text,
                    marginLeft: 12,
                    fontWeight: "500",
                  }}
                >
                  Select Text
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  navBtn: { padding: 8 },
  list: { padding: 15, paddingBottom: 60 },
  verseBox: { marginBottom: 15, paddingHorizontal: 5, transitionDelay: "0.3s" },
  verseNum: { fontWeight: "bold", fontSize: 13, opacity: 0.5 },
  verseText: { fontSize: 18, lineHeight: 28, fontFamily: "NotoSans" },
  italicText: { fontStyle: "italic", fontFamily: "NotoSansItalic" },
  modalFull: { flex: 1 },
  modalTopNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backBtn: { paddingRight: 15 },
  modalTitle: { fontSize: 18, fontWeight: "bold", flex: 1 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 15,
    position: "relative",
  },
  searchIcon: { position: "absolute", left: 15, zIndex: 1 },
  searchBar: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 45,
    paddingRight: 15,
    fontSize: 16,
  },
  scrollContent: { paddingBottom: 50 },
  bookRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 18,
    borderBottomWidth: 0.5,
  },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", padding: 10 },
  gridCard: {
    width: (width - 60) / 5,
    aspectRatio: 1,
    margin: 5,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      android: { elevation: 2 },
      ios: { shadowOpacity: 0.1, shadowRadius: 2 },
    }),
  },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.1)" },
  contextMenu: {
    position: "absolute",
    width: 170,
    borderRadius: 12,
    padding: 4,
    elevation: 15,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  contextItem: { flexDirection: "row", alignItems: "center", padding: 14 },
  separator: { height: 1, width: "100%" },
});

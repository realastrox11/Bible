import { useEffect, Suspense } from "react";
import { useColorScheme, ActivityIndicator, View } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider } from "expo-sqlite";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [loaded, error] = useFonts({
    NotoSans: require("./assets/fonts/NotoSans.ttf"),
    NotoSansItalic: require("./assets/fonts/NotoSans-Italic.ttf"),
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  const CustomDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: "#000",
      text: "#fff",
      card: "#000",
    },
  };

  const CustomLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: "#fff",
      text: "#000",
      card: "#fff",
    },
  };

  return (
    <ThemeProvider value={isDark ? CustomDarkTheme : CustomLightTheme}>
      <Suspense
        fallback={
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              backgroundColor: isDark ? "#000" : "#fff",
            }}
          >
            <ActivityIndicator color={isDark ? "#fff" : "#000"} />
          </View>
        }
      >
        <SQLiteProvider
          databaseName="kjv.sqlite"
          assetSource={{ assetId: require("./assets/bibles/kjv.sqlite") }}
          useSuspense
        >
          <Stack
            screenOptions={{
              headerTitleStyle: {
                fontFamily: "NotoSans",
                color: isDark ? "#fff" : "#000",
              },
              headerStyle: { backgroundColor: isDark ? "#000" : "#fff" },
              headerTintColor: isDark ? "#fff" : "#000",
              headerShadowVisible: false,
            }}
          />
        </SQLiteProvider>
      </Suspense>
    </ThemeProvider>
  );
}

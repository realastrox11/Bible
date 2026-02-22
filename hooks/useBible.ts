import * as SQLite from "expo-sqlite";

const databaseName = "kjv.sqlite";

export async function getBibleMetadata() {
  const db = await SQLite.openDatabaseAsync(databaseName);
  const firstRow = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM meta WHERE field = 'shortname'",
  );
  return firstRow?.value;
}

export async function getVerses(book: string, chapter: number) {
  const db = await SQLite.openDatabaseAsync(databaseName);
  const allRows = await db.getAllAsync<{
    id: number;
    book: string;
    chapter: number;
    verse: number;
    text: string;
  }>(
    "SELECT id, book, chapter, verse, text FROM verses WHERE book = ? AND chapter = ?",
    [book, chapter],
  );
  return allRows;
}

const Bible = {
  getBibleMetadata,
  getVerses,
};

export default Bible;

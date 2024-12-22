import { GoogleSpreadsheet } from "google-spreadsheet";
import { GoogleAuth } from "google-auth-library";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("utils/Google");

export async function getGoogleSheet(
  serviceAccountEmail: string,
  serviceAccountPrivateKey: string,
  sheetId: string,
) {
  try {
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      credentials: {
        client_email: serviceAccountEmail,
        private_key: readAsBas64String(serviceAccountPrivateKey),
      },
    });

    const doc = new GoogleSpreadsheet(sheetId, auth);
    await doc.loadInfo();
    return doc;
  } catch (error) {
    logger(`Error fetching google sheet: ${error}`);
    throw error;
  }
}

export async function exportGSheetToCSV(
  serviceAccountEmail: string | undefined,
  serviceAccountPrivateKey: string | undefined,
  sheetId: string | undefined,
  worksheetName: string | undefined,
): Promise<string> {
  if (
    !serviceAccountEmail ||
    !serviceAccountPrivateKey ||
    !sheetId ||
    !worksheetName
  ) {
    throw new Error("All google arguments must be passed");
  }
  try {
    const doc = await getGoogleSheet(
      serviceAccountEmail,
      serviceAccountPrivateKey,
      sheetId,
    );
    const sheet = doc.sheetsByTitle[worksheetName];
    if (!sheet) {
      throw new Error(`Sheet ${worksheetName} not found`);
    }
    const arrayBuffer = await sheet.downloadAsCSV();
    const csvData = arrayBufferToString(arrayBuffer);
    return csvData;
  } catch (error) {
    logger(`Error exporting google sheet to CSV ${error}`);
    throw error;
  }
}

function readAsBas64String(serviceAccountPrivateKey: string): string {
  const temp = serviceAccountPrivateKey.replace(/\\n/g, '\n');// Buffer.from(serviceAccountPrivateKey , 'base64').toString('ascii');
  return temp;
}

function arrayBufferToString(buffer: ArrayBuffer): string {
  return new TextDecoder("utf-8").decode(new Uint8Array(buffer));
}

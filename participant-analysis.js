import axios from 'axios';
import xlsx from 'xlsx';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import { loginGalxe } from './login-galxe.js';

dotenv.config();

/**
 * Galxe Participant Analysis Tool
 * - Fetches participants from campaigns
 * - Compares with your wallet list
 * - Exports matched (winning) wallets to Google Sheets
 */

// Config from .env
const CONFIG = {
  GOOGLE_CREDENTIALS_PATH: process.env.GOOGLE_CREDENTIALS_PATH,
  SPREADSHEET_ID: process.env.SPREADSHEET_ID,
  SHEET_RANGE: process.env.SHEET_RANGE || 'Sheet1!A:A',
  LOCAL_EXCEL_PATH: process.env.LOCAL_WALLETS_EXCEL,
  EXCEL_SHEET_NAME: process.env.EXCEL_SHEET_NAME || 'Sheet1',
  EXCEL_WALLET_COLUMN: parseInt(process.env.EXCEL_WALLET_COLUMN) || 3,
};

/**
 * Load user's wallets from local Excel file
 */
function loadMyWallets() {
  if (!CONFIG.LOCAL_EXCEL_PATH) {
    throw new Error('LOCAL_WALLETS_EXCEL path is not set in .env');
  }

  console.log(`📂 Loading wallets from: ${CONFIG.LOCAL_EXCEL_PATH}`);
  const workbook = xlsx.readFile(CONFIG.LOCAL_EXCEL_PATH);
  const sheet = workbook.Sheets[CONFIG.EXCEL_SHEET_NAME];
  
  if (!sheet) {
    throw new Error(`Sheet "${CONFIG.EXCEL_SHEET_NAME}" not found`);
  }

  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  const myWallets = {};

  for (let i = 1; i < data.length; i++) {
    const wallet = data[i][CONFIG.EXCEL_WALLET_COLUMN];
    if (typeof wallet === 'string' && wallet.trim()) {
      const normalized = wallet.trim().toLowerCase();
      myWallets[normalized] = true;
    } else if (wallet) {
      console.warn(`⚠️ Invalid wallet at row ${i + 1}:`, wallet);
    }
  }

  console.log(`✅ Loaded ${Object.keys(myWallets).length} wallets`);
  return myWallets;
}

/**
 * Authenticate with Google Sheets API
 */
async function authenticateGoogle() {
  if (!CONFIG.GOOGLE_CREDENTIALS_PATH) {
    throw new Error('GOOGLE_CREDENTIALS_PATH is not set in .env');
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: CONFIG.GOOGLE_CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth.getClient();
}

/**
 * Update Google Sheet with winning wallets
 */
async function updateGoogleSheet(auth, values) {
  const sheets = google.sheets({ version: 'v4', auth });
  const formattedValues = values.map(value => [value]);

  await sheets.spreadsheets.values.update({
    spreadsheetId: CONFIG.SPREADSHEET_ID,
    range: CONFIG.SHEET_RANGE,
    valueInputOption: 'RAW',
    resource: { values: formattedValues },
  });

  console.log(`✅ Updated Google Sheet with ${values.length} winning wallets`);
}

/**
 * Fetch all participants from Galxe campaign
 */
async function fetchAllGalaxyWinners(questId, token) {
  console.log(`🌌 Fetching Galxe participants for quest: ${questId}`);
  let allWinners = [];
  let pafter = "-1";

  while (true) {
    const payload = {
      operationName: "campaignParticipants",
      query: `query campaignParticipants($id: ID!, $pfirst: Int!, $pafter: String!) {
        campaign(id: $id) {
          participants {
            participants(first: $pfirst, after: $pafter) {
              list {
                address { address }
              }
              pageInfo {
                endCursor
                hasNextPage
              }
            }
          }
        }
      }`,
      variables: { id: questId, pfirst: 50, pafter },
    };

    try {
      const response = await axios.post('https://graphigo.prd.galaxy.eco/query', payload, {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
      });

      const participants = response.data?.data?.campaign?.participants?.participants?.list || [];
      allWinners.push(...participants.map(p => p.address.address.toLowerCase().trim()));

      const pageInfo = response.data?.data?.campaign?.participants?.participants?.pageInfo || {};
      if (!pageInfo.hasNextPage) break;

      pafter = pageInfo.endCursor;
    } catch (error) {
      console.error('❌ Galxe API error:', error.response?.data || error.message);
      break;
    }
  }

  console.log(`📊 Total Galxe participants fetched: ${allWinners.length}`);
  return allWinners;
}

/**
 * Main function
 */
async function main() {
  try {
    const questId = process.argv[2];
    if (!questId) {
      console.error('❌ Please provide Quest ID: node participant-analysis.js <questId>');
      process.exit(1);
    }

    // 1. Load local wallets
    const myWallets = loadMyWallets();

    // 2. Login to Galxe
    console.log('🔑 Logging into Galxe...');
    const token = await loginGalxe(process.env.PRIVATE_KEY);
    if (!token) throw new Error('Failed to get Galxe token');

    // 3. Fetch participants
    const winnerAddresses = await fetchAllGalaxyWinners(questId, token);

    // 4. Compare with your wallets
    const myWinningWallets = winnerAddresses.filter(wallet => myWallets[wallet]);
    console.log(`🎉 Found ${myWinningWallets.length} matching wallets!`);

    if (myWinningWallets.length > 0) {
      // 5. Update Google Sheet
      const auth = await authenticateGoogle();
      await updateGoogleSheet(auth, myWinningWallets);
    } else {
      console.log('ℹ️ No matching wallets found.');
    }

    console.log('✅ Analysis completed successfully!');
  } catch (error) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  }
}

main();

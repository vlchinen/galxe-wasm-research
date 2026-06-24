import axios from 'axios';
import { ethers } from 'ethers';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Generate a random string for entropy/nonce
 * @param {number} length - Desired length of the string
 * @returns {string} Random hexadecimal string
 */
const randomStringForEntropy = (length) => {
  const byteLength = Math.ceil(length / 2);
  return crypto.randomBytes(byteLength).toString('hex').slice(0, length);
};

/**
 * Login to Galxe using Ethereum wallet signature
 * @param {string} privateKey - Private key of the wallet (0x prefixed)
 * @returns {Promise<string|null>} Authentication token or null if failed
 */
const loginGalxe = async (privateKey) => {
  try {
    if (!privateKey) {
      throw new Error('Private key is required');
    }

    const wallet = new ethers.Wallet(privateKey);
    const nonce = randomStringForEntropy(96);
    const issuedAt = new Date().toISOString();
    const expiredAt = new Date(Date.now() + 60 * 24 * 7 * 60000).toISOString(); // 7 days

    // Create SIWE (Sign-In with Ethereum) message
    const message = `app.galxe.com wants you to sign in with your Ethereum account:\n${wallet.address}\n\nSign in with Ethereum to the app.\n\nURI: https://app.galxe.com\nVersion: 1\nChain ID: 56\nNonce: ${nonce}\nIssued At: ${issuedAt}\nExpiration Time: ${expiredAt}`;

    // Sign the message
    const signature = await wallet.signMessage(message);

    // Request payload
    const data = {
      query: `mutation SignIn($input: Auth) { signin(input: $input) }`,
      variables: {
        input: {
          address: wallet.address,
          signature: signature,
          message: message,
          addressType: 'EVM',
          publicKey: '1625',
        },
      },
    };

    const response = await axios.post(
      'https://graphigo.prd.galaxy.eco/query',
      data,
      {
        headers: {
          accept: '*/*',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
        },
      }
    );

    const token = response.data?.data?.signin;

    if (!token) {
      throw new Error('Failed to get token from response');
    }

    console.log('✅ Login successful!');
    console.log('🔑 Token:', token);
    
    return token;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return null;
  }
};

// =============== MAIN EXECUTION ===============

const main = async () => {
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ Please set PRIVATE_KEY in your .env file');
    console.log('\nExample:');
    console.log('PRIVATE_KEY=0x1234...\n');
    process.exit(1);
  }

  await loginGalxe(privateKey);
};

main();

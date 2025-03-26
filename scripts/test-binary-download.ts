#!/usr/bin/env ts-node
const { downloadCVWonderBinary } = require('../lib/initialize-server');

async function testBinaryDownload() {
  try {
    console.log('CVWONDER_VERSION:', process.env.CVWONDER_VERSION || 'latest');
    await downloadCVWonderBinary();
    console.log('Binary download test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testBinaryDownload();
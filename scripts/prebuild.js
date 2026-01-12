const fs = require("fs");
const path = require("path");

function copyIfExists(from, to) {
  if (fs.existsSync(from)) {
    fs.copyFileSync(from, to);
    console.log(`Copied: ${from} -> ${to}`);
    return true;
  }
  return false;
}

const { exec } = require('child_process')

async function listFilesInDirectory(directoryPath) {
  try {
    const files = await fs.readdir(directoryPath)
    return files
  } catch (err) {
    console.error('Error reading directory:', err)
  }
}

async function deleteAllFilesInDirectory(directoryPath) {
  try {
    const files = await fs.readdirSync(directoryPath)

    for (const file of files) {
      const filePath = path.join(directoryPath, file)
      await fs.unlinkSync(filePath)
    }
    return true
  } catch (err) {
    return true
  }
}

const cacheDir = path.join(process.cwd(), ".cache");
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

const outPath = path.join(cacheDir, "usdcContracts.js");

fs.writeFileSync(
  outPath,
  `const usdcContracts = {
  1: { address: "" },
  137: { address: "" },
  42161: { address: "" },
  10: { address: "" },
  8453: { address: "" },
};

export default usdcContracts;
`
);

console.log("Generated:", outPath);

deleteAllFilesInDirectory('.cache').then(() => {
  exec(
    'tsc --module ES6 --outDir .cache ./utils/chains.ts ./utils/usdcContracts.ts',
    (error, stdout, stderr) => {
      // No renaming, no .mjs, just .js output

      // Patch .cache/chains.js import extension
      const chainsPath = path.join(process.cwd(), ".cache", "chains.js");
      if (fs.existsSync(chainsPath)) {
        let chainsCode = fs.readFileSync(chainsPath, "utf8");
        chainsCode = chainsCode.replace(
          /from\s+['"]\.\/usdcContracts['"]/g,
          "from './usdcContracts.js'"
        );
        fs.writeFileSync(chainsPath, chainsCode);
        console.log("Patched import in .cache/chains.js -> ./usdcContracts.js");
      }
    }
  )
})

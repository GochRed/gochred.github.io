import sharp from 'sharp';

async function checkSize() {
  const response = await fetch('https://gochred.github.io/arrakis/img/phone.webp');
  const buffer = await response.arrayBuffer();
  const image = sharp(Buffer.from(buffer));
  const metadata = await image.metadata();
  console.log(`Size: ${metadata.width}x${metadata.height}`);
}

checkSize();

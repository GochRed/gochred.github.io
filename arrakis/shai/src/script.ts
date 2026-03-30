import fs from 'fs';
import https from 'https';

https.get('https://gochred.github.io/arrakis/img/phone.webp', (res) => {
  const file = fs.createWriteStream('phone.webp');
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Downloaded phone.webp');
  });
});

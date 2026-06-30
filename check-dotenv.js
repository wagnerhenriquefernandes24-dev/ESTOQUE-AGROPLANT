import 'dotenv/config';
console.log("Password parsed by dotenv is:");
console.log(process.env.ADMIN_PASSWORD);
console.log("Length:", process.env.ADMIN_PASSWORD?.length);

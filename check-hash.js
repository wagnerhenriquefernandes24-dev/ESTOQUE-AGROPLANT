import bcrypt from 'bcryptjs';

const hash = "$2b$12$NAxjpZzCp.UaoCsEXmEDFuzZpJmX5I4ES6VSgd3EZjbz0c/aoEhHe";
const pass1 = "Nmor190627@#";
const pass2 = "Nmor190627@#627@#";

async function check() {
  const match1 = await bcrypt.compare(pass1, hash);
  const match2 = await bcrypt.compare(pass2, hash);
  console.log(`Match Nmor190627@#: ${match1}`);
  console.log(`Match Nmor190627@#627@#: ${match2}`);
}

check();

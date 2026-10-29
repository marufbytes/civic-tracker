const fs = require('fs');

function edit(file, changes) {
  let t = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  for (const [from, to] of changes) {
    if (!t.includes(from)) throw new Error(file + ' - not found: ' + from.slice(0, 70));
    t = t.replace(from, to);
  }
  fs.writeFileSync(file, t, 'utf8');
}

edit('src/components/AuthModal.tsx', [
  ["  const [error, setError] = useState<string | null>(null);\n",
   "  const [error, setError] = useState<string | null>(null);\n  // Green message shown after the account was created\n  const [notice, setNotice] = useState<string | null>(null);\n"],
  // switching mode clears the notice
  ["    setStep('form');\n    setError(null);\n  };\n\n  // Runs",
   "    setStep('form');\n    setError(null);\n    setNotice(null);\n  };\n\n  // Runs"],
  // login success goes to the dashboard
  ["  const finish = (res: AuthResult) => {\n    toast('success', res.message);\n    onClose();\n    router.refresh();\n  };\n",
   `  // After a successful log in, go straight to the dashboard
  const finishLogin = (res: AuthResult) => {
    toast('success', res.message);
    onClose();
    router.push('/dashboard');
    router.refresh();
  };

  // After sign up the account exists, but the user must log in by hand
  const finishSignUp = () => {
    toast('success', 'Account created successfully! Please log in.', 6);
    setNotice('Account created successfully! Please log in.');
    setMode('login');
    setStep('form');
    setPassword('');
    setCode('');
  };
`],
  ["run(() => logIn(makeFormData()), finish);", "run(() => logIn(makeFormData()), finishLogin);"],
  ["run(() => verifySignUp(makeFormData()), finish);", "run(() => verifySignUp(makeFormData()), finishSignUp);"],
  ["          {error && (\n            <p className=\"rounded-lg bg-red-50",
   "          {notice && (\n            <p className=\"flex items-center gap-2 rounded-lg bg-green-50 p-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300\">\n              <CheckCircle2 size={16} /> {notice}\n            </p>\n          )}\n\n          {error && (\n            <p className=\"rounded-lg bg-red-50"],
  ["import { ArrowLeft, KeyRound,", "import { ArrowLeft, CheckCircle2, KeyRound,"],
]);
console.log('ok');


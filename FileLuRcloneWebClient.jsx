import React, { useState, useCallback, useMemo } from 'react';

// Tailwind CSS ကို အသုံးပြုထားတဲ့ FileLu Rclone Management Web Client App
// ဒီ App ဟာ သုံးစွဲသူတွေကို FileLu remote ကို set-up လုပ်ပုံနဲ့ အဓိက commands တွေကို ပြသပေးပါတယ်။

// Icon components (lucide-react ကို အသုံးပြုမည့်အစား inline SVG ကိုသုံးပါမည်)
const FolderIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z"/>
  </svg>
);

const CopyIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
  </svg>
);

// Utility function to copy text to clipboard
const copyToClipboard = (text) => {
  if (typeof document.execCommand === 'function') {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch (err) {
      console.error('Fallback copy failed', err);
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
  return false;
};


// Component for command block
const CommandBlock = ({ title, command, remoteName, isCopying, handleCopy }) => {
  const finalCommand = command.replace(/\{remoteName\}/g, remoteName);
  
  return (
    <div className="bg-gray-700/50 p-4 rounded-xl shadow-md transition-shadow hover:shadow-lg backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-indigo-300 mb-2 border-b border-indigo-500/50 pb-1">{title}</h3>
      <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg font-mono text-sm text-white">
        <code className="break-all pr-2 flex-grow">{finalCommand}</code>
        <button
          onClick={() => handleCopy(finalCommand)}
          className={`ml-3 p-2 rounded-lg text-sm transition-colors ${
            isCopying === finalCommand ? 'bg-green-600 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'
          }`}
          aria-label={`Copy ${title} command`}
        >
          <CopyIcon className="w-5 h-5 inline" />
        </button>
      </div>
      {isCopying === finalCommand && (
        <p className="mt-2 text-xs text-green-400">Command copied to clipboard!</p>
      )}
    </div>
  );
};


const App = () => {
  const [remoteName, setRemoteName] = useState('filelu');
  const [apiKey, setApiKey] = useState('YOUR_FILELU_RCLONE_KEY');
  const [localPath, setLocalPath] = useState('/path/to/local/folder');
  const [remotePath, setRemotePath] = useState('/backup/my-files');
  const [isCopying, setIsCopying] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  // Copy function with timeout for UI feedback
  const handleCopy = useCallback((command) => {
    if (copyToClipboard(command)) {
      setIsCopying(command);
      setShowNotification(true);
      
      // Remove copying status and notification after a short delay
      setTimeout(() => {
        setIsCopying(null);
      }, 1500);
      
      setTimeout(() => {
        setShowNotification(false);
      }, 2000);
    }
  }, []);

  // rclone Command Definitions
  const rcloneCommands = useMemo(() => [
    { 
      title: 'Get Account Storage Info', 
      command: 'rclone about {remoteName}:' 
    },
    { 
      title: 'Copy Local to FileLu', 
      command: `rclone copy ${localPath} {remoteName}:${remotePath}`
    },
    { 
      title: 'Sync Local to Remote (One-way)', 
      command: `rclone sync ${localPath} {remoteName}:${remotePath} --progress --dry-run` 
    },
    { 
      title: 'Mount FileLu as Local Drive (Linux/Mac)', 
      command: 'rclone mount {remoteName}: /mnt/filelu --vfs-cache-mode full' 
    },
    { 
      title: 'List Remote Directory Contents', 
      command: `rclone ls {remoteName}:${remotePath}` 
    },
  ], [localPath, remotePath]);


  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 font-sans antialiased">
      <script src="https://cdn.tailwindcss.com"></script>
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8 pt-4">
          <FolderIcon className="w-12 h-12 mx-auto text-indigo-400" />
          <h1 className="text-4xl font-extrabold mt-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-400">
            FileLu Rclone Web Client
          </h1>
          <p className="text-gray-400 mt-2">
            A simple web interface concept for configuring and managing FileLu storage via Rclone CLI.
          </p>
        </header>

        {/* Configuration Panel */}
        <section className="bg-gray-800 p-6 rounded-2xl shadow-2xl mb-10 border border-gray-700">
          <h2 className="text-2xl font-bold text-indigo-400 mb-4">1. Rclone Configuration Setup</h2>
          <p className="text-sm text-gray-400 mb-4">
            Run this command first to configure your remote. The API Key must be obtained from your FileLu account.
          </p>

          <div className="mb-4">
            <label htmlFor="remoteName" className="block text-sm font-medium text-gray-300 mb-1">
              Remote Name
            </label>
            <input
              type="text"
              id="remoteName"
              value={remoteName}
              onChange={(e) => setRemoteName(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., filelu"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-1">
              FileLu Rclone Key
            </label>
            <input
              type="text"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Note: This key is sensitive. This UI is for demonstration purposes only.
            </p>
          </div>
          
          {/* Configuration Command */}
          <CommandBlock
            title="Rclone Config Command (Step 1)"
            command="rclone config"
            remoteName={remoteName}
            isCopying={isCopying}
            handleCopy={handleCopy}
          />
          <p className="mt-4 text-sm text-yellow-300">
            When running 'rclone config', use '{remoteName}' as the name and enter your API Key when prompted.
          </p>
        </section>

        {/* Command Examples */}
        <section className="bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-700">
          <h2 className="text-2xl font-bold text-indigo-400 mb-6">2. File Management Command Examples</h2>
          
          <div className="space-y-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/2">
                <label htmlFor="localPath" className="block text-sm font-medium text-gray-300 mb-1">
                  Local Folder Path (Source)
                </label>
                <input
                  type="text"
                  id="localPath"
                  value={localPath}
                  onChange={(e) => setLocalPath(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label htmlFor="remotePath" className="block text-sm font-medium text-gray-300 mb-1">
                  FileLu Remote Path (Destination)
                </label>
                <input
                  type="text"
                  id="remotePath"
                  value={remotePath}
                  onChange={(e) => setRemotePath(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rcloneCommands.map((item, index) => (
              <CommandBlock
                key={index}
                title={item.title}
                command={item.command}
                remoteName={remoteName}
                isCopying={isCopying}
                handleCopy={handleCopy}
              />
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-yellow-900/40 border-l-4 border-yellow-500 rounded-lg">
              <p className="text-sm text-yellow-200 font-medium">
                  <span className="font-bold">သတိပြုရန်:</span> `sync` command ကို မ run ခင် ` --dry-run` ကို အရင် run ပြီး စစ်ဆေးပါ။ `sync` ဟာ Destination (FileLu) မှာ Source ထက် ပိုနေတဲ့ ဖိုင်တွေကို ဖျက်ပစ်ပါလိမ့်မယ်။
              </p>
          </div>
        </section>

        {/* Global Copy Notification */}
        {showNotification && (
          <div className="fixed bottom-5 right-5 bg-green-500 text-white px-4 py-2 rounded-lg shadow-xl transition-opacity duration-300">
            Command Copied!
          </div>
        )}

      </div>
    </div>
  );
};

export default App;

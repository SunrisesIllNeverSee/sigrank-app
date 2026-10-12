import { execSync } from "child_process";

const targets = [
  { url: "http://localhost:3230/board/all", out: "release-staging/evidence/actual-safari-leaderboard-toolbar.png" },
  { url: "http://localhost:3230/user/xoxo", out: "release-staging/evidence/actual-safari-profile-opening.png" },
  { url: "http://localhost:3230/compare?a=xoxo&b=furic", out: "release-staging/evidence/actual-safari-compare.png" },
  { url: "http://localhost:3230/wiki", out: "release-staging/evidence/actual-safari-editorial-wiki.png" },
];

for (const t of targets) {
  console.log(`Navigating Safari to ${t.url}...`);
  execSync(`/usr/bin/osascript -e '
tell application "Safari"
  activate
  set URL of current tab of front window to "${t.url}"
  delay 2.5
end tell'`);
  console.log(`Capturing ${t.out}...`);
  execSync(`screencapture -R50,50,1440,900 "${t.out}"`);
}

console.log("All actual Safari screenshots captured successfully.");

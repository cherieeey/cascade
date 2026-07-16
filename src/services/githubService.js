const ALLOWED_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.vue', '.py', '.java',
  '.cs', '.php', '.rb', '.go', '.json', '.prisma', '.md',
]);

function parseRepositoryUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Enter a valid GitHub repository URL.');
  }

  if (url.hostname !== 'github.com') {
    throw new Error('For this MVP, only public github.com repositories are supported.');
  }

  const [owner, repository] = url.pathname.split('/').filter(Boolean);
  if (!owner || !repository) {
    throw new Error('The URL must include a GitHub owner and repository.');
  }

  return { owner, repository: repository.replace(/\.git$/, '') };
}

function extension(path) {
  const dot = path.lastIndexOf('.');
  return dot === -1 ? '' : path.slice(dot).toLowerCase();
}

async function githubFetch(path) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'cascade-learning-app',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(`https://api.github.com${path}`, { headers });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Repository not found. Make sure it is public and the URL is correct.');
    }
    if (response.status === 403) {
      throw new Error('GitHub request limit reached. Try again later or configure GITHUB_TOKEN.');
    }
    throw new Error(`GitHub returned ${response.status}.`);
  }
  return response.json();
}

async function readRepository(repositoryUrl) {
  const { owner, repository } = parseRepositoryUrl(repositoryUrl);
  const info = await githubFetch(`/repos/${owner}/${repository}`);
  const tree = await githubFetch(
    `/repos/${owner}/${repository}/git/trees/${encodeURIComponent(info.default_branch)}?recursive=1`,
  );

  const files = tree.tree
    .filter((item) => item.type === 'blob' && item.size <= 80_000)
    .filter((item) => ALLOWED_EXTENSIONS.has(extension(item.path)))
    .filter((item) => !/(node_modules|dist|build|coverage|vendor|lock)/i.test(item.path))
    .sort((a, b) => {
      const priority = (path) => (
        /readme|package\.json|schema|route|controller|page|app\./i.test(path) ? 0 : 1
      );
      return priority(a.path) - priority(b.path) || a.size - b.size;
    })
    .slice(0, 18);

  const contents = await Promise.all(files.map(async (file) => {
    const data = await githubFetch(`/repos/${owner}/${repository}/contents/${file.path}`);
    const text = data.encoding === 'base64'
      ? Buffer.from(data.content, 'base64').toString('utf8')
      : '';
    return `--- ${file.path}\n${text.slice(0, 7_000)}`;
  }));

  return {
    name: info.name,
    owner: info.owner.login,
    description: info.description || 'No repository description provided.',
    language: info.language || 'Mixed',
    stars: info.stargazers_count,
    url: info.html_url,
    fileCount: tree.tree.filter((item) => item.type === 'blob').length,
    source: contents.join('\n\n').slice(0, 75_000),
  };
}

module.exports = { readRepository };

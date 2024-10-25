#!/usr/bin/env bun

import inquirer from 'inquirer';
import path from 'path';
import { writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import ora from 'ora';

// Bun does not require checking for the environment
// since this script is executed in Bun

async function spawnProcess(command: string[], options: any = {}): Promise<void> {
    const process = Bun.spawn(command, {
        ...options,

        stdout: "ignore"
    });

    await process.exited; // Wait for the process to exit
}

async function createViteApp(projectName: string) {
    const spinner = ora('Creating Vite React app...').start();
    try {
        await spawnProcess(['bun', 'create', 'vite', projectName, '--template', 'react-ts']);
        spinner.succeed('Vite React app created');

        spinner.start('Installing dependencies...');
        await spawnProcess(['bun', 'install'], { cwd: projectName, });
        spinner.succeed('Dependencies installed');
    } catch (error) {
        spinner.fail('Failed to create project');
        throw error;
    }
}

async function installReactRouter(projectName: string) {
    const spinner = ora('Installing React Router...').start();
    try {
        await spawnProcess(['bun', 'add', 'react-router-dom'], { cwd: projectName });
        spinner.succeed('React Router installed');
    } catch (error) {
        spinner.fail('Failed to install React Router');
        throw error;
    }
}

async function installTailwind(projectName: string) {
    const spinner = ora('Installing Tailwind CSS...').start();
    try {
        await spawnProcess(
            ['bun', 'add', '-D', 'tailwindcss', 'postcss', 'autoprefixer'],
            { cwd: projectName }
        );

        await spawnProcess(['npx', 'tailwindcss', 'init', '-p'], { cwd: projectName });

        const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;

        const cssContent = `
@tailwind base;
@tailwind components;
@tailwind utilities;`;

        await writeFile(path.join(projectName, 'tailwind.config.js'), tailwindConfig);
        await writeFile(path.join(projectName, 'src/index.css'), cssContent);

        const appCssPath = path.join(projectName, 'src/App.css');
        if (existsSync(appCssPath)) {
            await unlink(appCssPath);
        }

        spinner.succeed('Tailwind CSS installed and configured');
    } catch (error) {
        spinner.fail('Failed to install Tailwind CSS');
        throw error;
    }
}

async function initReactRouter(projectName: string) {
    const spinner = ora('Setting up React Router...').start();
    try {
        const routerTemplate = `import { createBrowserRouter, RouterProvider } from 'react-router-dom';

function Home() {
  return <h2>Home Page</h2>;
}

function About() {
  return <h2>About Page</h2>;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/about',
    element: <About />,
  },
]);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;`;

        await writeFile(path.join(projectName, 'src/App.tsx'), routerTemplate);
        spinner.succeed('React Router setup completed');
    } catch (error) {
        spinner.fail('Failed to setup React Router');
        throw error;
    }
}

async function runCLI() {
    console.log('\n📦 Welcome to create-reactframe!\n');

    try {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'projectName',
                message: 'What is the name of your project?',
                default: 'my-app',
                validate: (input: string) => {
                    if (input === '.') {
                        return 'Creating a project in the current directory is not supported.';
                    }
                    if (existsSync(input)) {
                        return 'Directory already exists. Please choose a different name.';
                    }
                    return true;
                }
            },
            {
                type: 'confirm',
                name: 'useReactRouter',
                message: 'Would you like to include React Router?',
                default: true,
            },
            {
                type: 'confirm',
                name: 'useTailwind',
                message: 'Would you like to include Tailwind CSS?',
                default: true,
            }
        ]);

        const { projectName, useReactRouter, useTailwind } = answers;

        await createViteApp(projectName);

        if (useReactRouter) {
            await installReactRouter(projectName);
            await initReactRouter(projectName);
        }

        if (useTailwind) {
            await installTailwind(projectName);
        }

        console.log('\n✅ Project setup completed successfully!');
        console.log(`\nTo get started:\n`);
        console.log(`  cd ${projectName}`);
        console.log(`  bun run dev\n`);
    } catch (error) {
        console.error('\nError:', error);
        process.exit(1);
    }
}

// Run the CLI
runCLI();

export { createViteApp, installReactRouter, installTailwind, initReactRouter };

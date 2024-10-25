#!/usr/bin/env bun
import inquirer from 'inquirer';
import { spawn } from 'bun';
import { writeFile } from 'fs/promises';
import path from 'path';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import ora from 'ora';
import chalk from 'chalk';

// Function to determine runtime
const isBun = process.argv[0].includes('bunx');
const packageManager = isBun ? 'bun' : 'npm';
const packageRunner = isBun ? 'bunx' : 'npx';

console.log(`Running with ${isBun ? 'Bun' : 'Node'}`);

// Function to create React app
export async function createViteApp(projectName: string) {

    const process_1 = spawn([packageManager, 'create', 'vite', projectName, '--template', 'react-ts'], {
        stdout: 'ignore',
        stderr: 'inherit',
    });

    await process_1.exited;

    console.log('\nInstalling dependencies...');
    if (process_1.exitCode === 0) {
        const installProcess = spawn([packageManager, 'install'], {
            cwd: projectName,
            stdout: 'ignore',
            stderr: 'inherit',
        });

        await installProcess.exited;
        console.log('Dependencies installed successfully.');


    }



}

// Function to install React Router
async function installReactRouter(projectName: string) {
    console.log(`Installing React Router...`);

    const process_1 = spawn([packageManager, 'add', 'react-router-dom'], {
        cwd: projectName,
        stdout: "ignore",
        stderr: "inherit",
    });

    await process_1.exited;

    console.log('React Router installed successfully.');
}

// Function to install Tailwind CSS
async function installTailwind(projectName: string) {
    try {
        console.log('Installing Tailwind CSS...');

        // Install Tailwind and PostCSS
        const installTailwindProcess = spawn([packageManager, 'add', '-D', 'tailwindcss', 'postcss', 'autoprefixer'], {
            cwd: projectName,
            stdout: 'ignore',
            stderr: 'inherit',
        });

        await installTailwindProcess.exited;

        // Initialize Tailwind CSS
        const initTailwindProcess = spawn([packageRunner, 'tailwindcss', 'init', '-p'], {
            cwd: projectName,
            stdout: 'ignore',
            stderr: 'inherit',
        });

        await initTailwindProcess.exited;

        // Configure Tailwind content paths and basic CSS
        const tailwindConfigPath = path.join(projectName, 'tailwind.config.js');
        await writeFile(tailwindConfigPath, `
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
`, 'utf8');

        const cssPath = path.join(projectName, 'src', 'index.css');
        await writeFile(cssPath, `
@tailwind base;
@tailwind components;
@tailwind utilities;
`, 'utf8');
        const appCssPath = path.join(projectName, 'src', 'App.css');
        await unlink(appCssPath);
        console.log('Tailwind CSS initialized successfully.');

    } catch (error) {
        console.error('Error:', error);
    }

}

// Function to initialize React Router in App.tsx
async function initReactRouter(projectName: string) {
    console.log('Setting up basic React Router...');

    const appJsPath = path.join(projectName, 'src', 'App.tsx');

    const reactRouterTemplate = `
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

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

export default App;
`;

    await writeFile(appJsPath, reactRouterTemplate, 'utf8');

    console.log('React Router initialized successfully.');
}

// Function to handle CLI input and actionsasync function runCLI() {


async function runCLI() {
    console.log(chalk.bold('\n📦 Welcome to create-reactframe!\n'));

    const spinner = ora();

    try {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'projectName',
                message: chalk.blue('What is the name of your project?'),
                default: 'my-app',
                validate: (input: string) => {
                    if (input.trim() === '') return 'Project name cannot be empty';
                    if (existsSync(input)) return 'Directory already exists';
                    return true;
                }
            },
            // ... other prompts
        ]);

        spinner.start('Creating your project...');
        await createViteApp(answers.projectName);
        spinner.succeed('Project created');

        spinner.start('Installing dependencies...');
        // ... rest of your code

        console.log(chalk.green('\n✨ Success! Created'), chalk.bold(answers.projectName), chalk.green('at'), chalk.bold(process.cwd()));
        console.log('\nInside that directory, you can run:\n');
        console.log(chalk.cyan('  npm run dev'));
        console.log('    Starts the development server.\n');
        console.log('Happy coding! 🎉\n');
    } catch (error) {
        spinner.fail('Failed to create project');
        console.error(error);
        process.exit(1);
    }
}

// Run the CLI
runCLI().catch((err) => console.error('Error:', err));


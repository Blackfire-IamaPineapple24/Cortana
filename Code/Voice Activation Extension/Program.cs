using System.Diagnostics;
using Microsoft.Win32.TaskScheduler;

namespace Vae
{
    class Program
    {
        static void Main(string[] args)
    {
        Console.Title = "Cortana Voice Activation Extension Installer";

        Console.WriteLine("Press any key to install the Cortana Voice Activation Extension.");
        Console.ReadKey();
        Console.WriteLine();

        Console.Write("Are you sure? (Y/N) ");
        // Proceed if the user presses Y
        while (Console.ReadKey().Key == ConsoleKey.Y)
        {
            Console.WriteLine();
            Install();
        }
    }

        static void Install()
        {
            string fileName = "";
            string source = "";
            string appDataPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), @"cortana\"); // Grab the AppData path
            string destination = "";

            Console.WriteLine("Installing...");

            // Copy files
            Console.WriteLine("Copying Python script");
            fileName = "wakeword-detector.pyw";
            source = Path.Combine(Environment.CurrentDirectory, fileName);
            destination = Path.Combine(appDataPath, fileName);
            try
            {
                File.Copy(source, destination);
                Console.WriteLine("Done.");
            }
            catch (DirectoryNotFoundException)
            {
                Console.WriteLine(@"AppData\Roaming\cortana not found. Is Cortana installed?");
                Console.WriteLine("Press any key to exit.");
                Console.ReadKey();
                Environment.Exit(0);
            }
            catch (FileNotFoundException)
            {
                Console.WriteLine("wakeword-detector.pyw was not found. Please make sure it exists in the same directory as the installer.");
                Console.WriteLine("Press any key to exit.");
                Console.ReadKey();
                Environment.Exit(0);
            }
            catch (IOException)
            {
                Console.WriteLine(@"An I/O exception has occurred. Most likely, wakeword-detector.pyw already exists in AppData\Roaming\cortana");
                Console.Write("Skip? ");
                while (Console.ReadKey().Key == ConsoleKey.N)
                {
                    Environment.Exit(0);
                }
                Console.WriteLine("Skipping...");
            }

            Console.WriteLine("Copying wake word model file");
            fileName = "hey_cor_tahnah.onnx";
            source = Path.Combine(Environment.CurrentDirectory, fileName);
            destination = Path.Combine(appDataPath, fileName);
            try
            {
                File.Copy(source, destination);
                Console.WriteLine("Done.");
            }
            catch (DirectoryNotFoundException)
            {
                Console.WriteLine(@"AppData\Roaming\cortana not found. Is Cortana installed?");
                Console.WriteLine("Press any key to exit.");
                Console.ReadKey();
                Environment.Exit(0);
            }
            catch (FileNotFoundException)
            {
                Console.WriteLine("hey_cor_tahnah.onnx was not found. Please make sure it exists in the same directory as the installer.");
                Console.WriteLine("Press any key to exit.");
                Console.ReadKey();
                Environment.Exit(0);
            }
            catch (IOException)
            {
                Console.WriteLine(@"An I/O exception has occurred. Most likely, hey_cor_tahnah.onnx already exists in AppData\Roaming\cortana");
                Console.Write("Skip? ");
                while (Console.ReadKey().Key == ConsoleKey.N)
                {
                    Environment.Exit(0);
                }
                Console.WriteLine("Skipping...");
            }

            // Check if the user has Python installed, and if not, prompt to install it
            PyCheck isPyInstalled = new PyCheck();
            if (isPyInstalled.Version().Contains("Python") != true)
            {
                Console.WriteLine("It appears Python is not installed on your system. Please install it from https://www.python.org/downloads/");
                Console.WriteLine("Press any key to exit.");
                Console.ReadLine();
                Environment.Exit(0);
            }

            Console.WriteLine("Creating startup task");
            CreateTask();

            // Start listening
            Console.WriteLine("Starting task");
            string script = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), @"cortana\wakeword-detector.pyw");
            System.Diagnostics.Process.Start("pythonw.exe", script);
            Console.WriteLine("Done.");

            Console.WriteLine("Installed. Press any key to exit.");
            Console.ReadKey();
        }

        static void CreateTask()
        {
            string script = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), @"cortana\wakeword-detector.pyw");

            TaskDefinition td = TaskService.Instance.NewTask();
            td.RegistrationInfo.Description = "Start listening for 'Hey Cortana' on startup. Uses ~130MB of RAM";

            LogonTrigger lt = new LogonTrigger();
            lt.UserId = Environment.UserName;
            td.Triggers.Add(lt);

            td.Actions.Add("pythonw.exe", script);

            TaskService.Instance.RootFolder.RegisterTaskDefinition("VAEStartup", td);

            Console.WriteLine("Done.");
        }
    }

// I am clueless. Stole this from the internet (Hippity Hoppity your code is now my property) because idk
    class PyCheck
    {
        public string Version()
        {
            string result = "";

            ProcessStartInfo checkPython = new ProcessStartInfo();
            checkPython.FileName = "python.exe";
            checkPython.Arguments = "--version";
            checkPython.UseShellExecute = false;
            checkPython.RedirectStandardOutput = true;
            checkPython.CreateNoWindow = true;

            using (Process process = Process.Start(checkPython))
            {
                using (StreamReader reader = process.StandardOutput)
                {
                    result = reader.ReadToEnd();
                    return result;
                }
            }
        }
    }
}
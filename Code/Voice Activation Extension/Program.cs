using System.Diagnostics;
using Microsoft.Win32.TaskScheduler;

namespace Vae
{
    class Program
    {
        static void Main(string[] args)
        {
            // Set up the window
            Console.Title = "Cortana Voice Activation Extension Installer";
            Console.ForegroundColor = ConsoleColor.Gray;

            Console.WriteLine("Cortana Voice Activation Extension Installer Version 2.0.0");
            Console.WriteLine();

            Console.ForegroundColor = ConsoleColor.White;
            Console.WriteLine("Press any key to install the Cortana Voice Activation Extension.");
            Console.ReadKey();
            Console.WriteLine();

            Console.Write("Are you sure? (Y/N) ");
            // Proceed if Y is pressed
            while (Console.ReadKey().Key == ConsoleKey.Y)
            {
                Console.WriteLine();
                Console.ForegroundColor = ConsoleColor.Blue;
                Install();
            }
        }

        static void Install()
        {
            string fileName = "";
            string source = "";
            string appDataPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), @"cortana\");
            string destination = "";

            Console.WriteLine("Installing...");

            // Copy the files
            Console.WriteLine("Copying Python script.");
            fileName = "wakeword-detector.pyw";
            source = Path.Combine(Environment.CurrentDirectory, fileName);
            destination = Path.Combine(appDataPath, fileName);
            try
            {
                File.Copy(source, destination);
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("Done.");
                Console.ForegroundColor = ConsoleColor.Blue;
            }
            catch (DirectoryNotFoundException)
            {
                Console.ForegroundColor = ConsoleColor.DarkRed;
                Console.WriteLine(@"AppData\Roaming\cortana not found. Please make sure Cortana is installed before running this installer.");
                Console.ForegroundColor = ConsoleColor.Blue;
                Console.WriteLine("Press any key to exit.");
                Console.ReadKey();
                Environment.Exit(0);
            }
            catch (FileNotFoundException)
            {
                Console.ForegroundColor = ConsoleColor.DarkRed;
                Console.WriteLine("wakeword-detector.pyw was not found. Please make sure the file exists and is in the same directory as this installer.");
                Console.ForegroundColor = ConsoleColor.Blue;
                Console.WriteLine("Press any key to exit.");
                Console.ReadKey();
                Environment.Exit(0);
            }
            catch (IOException)
            {
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("An I/O exception has occurred.");
                Console.WriteLine(@"This usually means wakeword-detector.pyw already exists in AppData\Roaming\cortana.");
                Console.WriteLine("If it does, this error is safe to ignore.");
                Console.ForegroundColor = ConsoleColor.Blue;
                Console.Write("Skip? ");
                while (Console.ReadKey().Key == ConsoleKey.N)
                {
                    Environment.Exit(0);
                }
                Console.WriteLine();
                Console.WriteLine("Skipping...");
            }

            Console.WriteLine("Copying wake word model file.");
            fileName = "hey_cor_tahnah.onnx";
            source = Path.Combine(Environment.CurrentDirectory, fileName);
            destination = Path.Combine(appDataPath, fileName);
            try
            {
                File.Copy(source, destination);
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("Done.");
                Console.ForegroundColor = ConsoleColor.Blue;
            }
            catch (DirectoryNotFoundException)
            {
                Console.ForegroundColor = ConsoleColor.DarkRed;
                Console.WriteLine(@"AppData\Roaming\cortana not found. Please make sure Cortana is installed before running this installer.");
                Console.ForegroundColor = ConsoleColor.Blue;
                Console.WriteLine("Press any key to exit.");
                Console.ReadKey();
                Environment.Exit(0);
            }
            catch (FileNotFoundException)
            {
                Console.ForegroundColor = ConsoleColor.DarkRed;
                Console.WriteLine("hey_cor_tahnah.onnx was not found. Please make sure the file exists and is in the same directory as this installer.");
                Console.ForegroundColor = ConsoleColor.Blue;
                Console.WriteLine("Press any key to exit.");
                Console.ReadKey();
                Environment.Exit(0);
            }
            catch (IOException)
            {
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("An I/O exception has occurred.");
                Console.WriteLine(@"This usually means hey_cor_tahnah.onnx already exists in AppData\Roaming\cortana.");
                Console.WriteLine("If it does, this error is safe to ignore.");
                Console.ForegroundColor = ConsoleColor.Blue;
                Console.Write("Skip? ");
                while (Console.ReadKey().Key == ConsoleKey.N)
                {
                    Environment.Exit(0);
                }
                Console.WriteLine();
                Console.WriteLine("Skipping...");
            }

            // Check if python is installed, and an instruction for the user if it isn't.
            PyCheck isPyInstalled = new PyCheck();
            if (!isPyInstalled.Version().Contains("Python"))
            {
                Console.ForegroundColor = ConsoleColor.DarkRed;
                Console.WriteLine("It appears that Python is not installed on your system. Please install the latest version from:");
                Console.WriteLine("https://www.python.org/downloads/");
                Console.ForegroundColor = ConsoleColor.Blue;
                Console.WriteLine("Press any key to exit.");
                Console.ReadKey();
                Environment.Exit(0);
            }

            Console.WriteLine("Creating startup task.");
            CreateTask();

            // Start listening.
            Console.WriteLine("Starting task.");
            string script = Path.Combine(appDataPath, @"cortana\wakeword-detector.pyw");
            System.Diagnostics.Process.Start("pythonw.exe", script);
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("Done.");
            Console.ForegroundColor = ConsoleColor.Blue;

            UninstInstruct();

            Console.WriteLine("Successfully installed. Press any key to exit.");
            Console.ReadKey();
        }

        static void CreateTask()
        {
            string script = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), @"cortana\wakeword-detector.pyw");

            TaskDefinition td = TaskService.Instance.NewTask();
            td.RegistrationInfo.Description = "Start listening for 'Hey Cortana' at startup. Uses ~130MB of system memory.";

            LogonTrigger lt = new LogonTrigger();
            lt.UserId = Environment.UserName;
            td.Triggers.Add(lt);

            td.Actions.Add("pythonw.exe", script);

            TaskService.Instance.RootFolder.RegisterTaskDefinition("Cortana Voice Activation Startup", td);

            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("Done.");
            Console.ForegroundColor = ConsoleColor.Blue;
        }

        static void UninstInstruct()
        {
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("=-----------------------------------------------------------=");
            Console.WriteLine("                   Uninstall Instructions                    ");
            Console.WriteLine("=-----------------------------------------------------------=");
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("Take a screenshot of this before exiting.");
            Console.ForegroundColor = ConsoleColor.White;
            Console.WriteLine("To uninstall:");
            Console.WriteLine("1. Open Task Manager (CTRL+SHIFT+ESC) and find Python");
            Console.WriteLine("   under 'Background Processes'.");
            Console.WriteLine("2. End the task.");
            Console.WriteLine("3. Open Task Scheduler (Win+R, taskschd.msc) and");
            Console.WriteLine("   delete the task 'Cortana Voice Activation Startup");
            Console.WriteLine("4. Go to %AppData%\\cortana in Explorer and move or");
            Console.WriteLine("   delete \"hey_cor_tahnah.onnx\" and \"wakeword-detector.pyw\".");
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("=-----------------------------------------------------------=");
            Console.ForegroundColor = ConsoleColor.Blue;
        }
    }

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
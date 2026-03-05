/**
 * projectFolders.ts
 *
 * Calls the local Volt Folder Server (execution/folder_server.py, port 5176)
 * to create the project folder structure on disk when a quote is saved.
 *
 * Folder structure created:
 *   C:\Users\kylet\Documents\Projects\
 *     [Company Name]\
 *       [Job Number] - [Project Name]\   <- only when job number is provided
 *         Invoices\
 *
 * Requires folder_server.py to be running (Start Volt1.1.bat starts it
 * automatically). If the server isn't reachable the save still succeeds —
 * folder creation is best-effort and never blocks the quote save.
 */

const FOLDER_SERVER = 'http://localhost:5176'

export interface FolderResult {
  supported: boolean
  created: boolean
  path: string
  error?: string
}

/**
 * Creates (or verifies) the company/job folder structure on disk.
 * Silently succeeds if the folder already exists.
 */
export async function ensureJobFolders(
  companyName: string,
  jobNumber?: string,
  projectName?: string
): Promise<FolderResult> {
  try {
    const res = await fetch(`${FOLDER_SERVER}/create-folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company: companyName,
        job_number: jobNumber ?? '',
        project_name: projectName ?? '',
      }),
    })

    const data = await res.json()

    if (data.ok) {
      return { supported: true, created: true, path: data.path }
    }
    return { supported: true, created: false, path: '', error: data.error }
  } catch {
    // Server not running — non-fatal, quote save still completes
    return {
      supported: false,
      created: false,
      path: '',
      error: 'Folder server not running (start via Start Volt1.1.bat)',
    }
  }
}

/**
 * Check whether the folder server is reachable.
 */
export async function isFolderServerRunning(): Promise<boolean> {
  try {
    const res = await fetch(`${FOLDER_SERVER}/ping`, { method: 'GET' })
    const data = await res.json()
    return data.ok === true
  } catch {
    return false
  }
}

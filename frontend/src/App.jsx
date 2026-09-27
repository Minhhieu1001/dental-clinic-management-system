import AppRouter from './routes/AppRouter.jsx'
import toast, { Toaster, ToastBar } from 'react-hot-toast'

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2000,
        }}
      >
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2">
                  {icon}
                  {message}
                </div>
                {t.type !== 'loading' && (
                  <button
                    type="button"
                    onClick={() => toast.dismiss(t.id)}
                    className="ml-2 flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors text-[10px] font-bold cursor-pointer shrink-0"
                    title="Đóng thông báo"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </ToastBar>
        )}
      </Toaster>
      <AppRouter />
    </>
  )
}

export default App

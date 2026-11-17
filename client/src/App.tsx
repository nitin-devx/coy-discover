import { useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";
import SwipeableProfileCard from "./components/SwipeableProfileCard";
import MatchesView from "./components/MatchesView";
import MatchModal from "./components/MatchModal";
import ScreenState from "./components/ScreenState";
import { useDiscover } from "./hooks/useDiscover";
import type { Tab } from "./types";

const tabs: { id: Tab; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "discover", label: "Discover" },
  { id: "matches", label: "Matches" },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("discover");
  const reduceMotion = useReducedMotion();

  const {
    profiles,
    matches,
    loading,
    loadError,
    swipeError,
    swiping,
    feedback,
    direction,
    matchedProfile,
    reload,
    swipe,
    closeMatch,
  } = useDiscover();

  const currentProfile = profiles[0];

  return (
    <div className="min-h-dvh overflow-x-clip bg-rose-50/50 text-slate-900">
      <header className="border-b border-rose-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5">
          <span className="text-3xl font-black tracking-tight text-rose-600">
            coy<span className="text-slate-900">.</span>
          </span>

          <span className="text-right text-sm font-medium text-slate-500">
            A little curiosity. A real connection.
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-8 pb-32">
        {activeTab !== "home" && (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-bold tracking-[0.2em] text-rose-600 uppercase">
                  {activeTab === "discover"
                    ? "Meet someone new"
                    : "Mutual connections"}
                </p>

                <button
                  type="button"
                  onClick={() => void reload()}
                  disabled={loading || swiping}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>

              <h1 className="mt-2 text-3xl font-bold">
                {activeTab === "discover" ? "Discover" : "Your matches"}
              </h1>

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Likes stay private until you both feel the same.
              </p>
            </div>

            {loading ? (
              <ScreenState
                title="Loading your connections"
                message="Just a moment…"
              />
            ) : loadError ? (
              <ScreenState
                title="Couldn’t load your data"
                message={loadError}
                actionLabel="Try again"
                onAction={() => void reload()}
                isError
              />
            ) : activeTab === "matches" ? (
              <MatchesView
                matches={matches}
                onDiscover={() => setActiveTab("discover")}
              />
            ) : (
              <>
                {swipeError && (
                  <div
                    role="alert"
                    className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                  >
                    {swipeError}
                  </div>
                )}

                <AnimatePresence
                  mode="wait"
                  custom={direction}
                  initial={false}
                >
                  {currentProfile ? (
                    <motion.div
                      key={currentProfile.id}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit="exit"
                      variants={{
                        exit: (exitDirection: number) => ({
                          x: reduceMotion ? 0 : exitDirection * 350,
                          opacity: 0,
                          rotate: reduceMotion ? 0 : exitDirection * 8,
                        }),
                      }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.2,
                      }}
                    >
                      <SwipeableProfileCard
                        profile={currentProfile}
                        disabled={swiping || matchedProfile !== null}
                        onSwipe={(action) => void swipe(action)}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: reduceMotion ? 0 : 0.2 }}
                    >
                      <ScreenState
                        title="You’re all caught up"
                        message="There are no more profiles to discover right now."
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <p
                  role="status"
                  className="mt-4 min-h-6 text-center text-sm text-slate-600"
                >
                  {swiping ? "Saving your choice…" : feedback}
                </p>

                {currentProfile && (
                  <p className="mt-2 text-center text-xs text-slate-400">
                    Swipe left to pass · Swipe right to like
                  </p>
                )}
              </>
            )}
          </>
        )}
      </main>

      <nav
        aria-label="Main navigation"
        className="fixed right-0 bottom-0 left-0 z-20 border-t border-rose-100 bg-white pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-2 p-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-current={activeTab === tab.id ? "page" : undefined}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-3 py-4 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-rose-100 text-rose-700"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {tab.label}
              {tab.id === "matches" && matches.length > 0
                ? ` (${matches.length})`
                : ""}
            </button>
          ))}
        </div>
      </nav>

      {matchedProfile && (
        <MatchModal
          profile={matchedProfile}
          onClose={closeMatch}
          onViewMatches={() => {
            closeMatch();
            setActiveTab("matches");
          }}
        />
      )}
    </div>
  );
}

export default App;
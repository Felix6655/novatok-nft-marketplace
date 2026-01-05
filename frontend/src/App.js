import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import { Toaster } from "./components/ui/sonner";
import Header from "./components/Header";
import ExplorePage from "./pages/ExplorePage";
import CollectionsPage from "./pages/CollectionsPage";
import CollectionDetailPage from "./pages/CollectionDetailPage";
import NFTDetailPage from "./pages/NFTDetailPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  return (
    <WalletProvider>
      <div className="App min-h-screen bg-background">
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<ExplorePage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/collection/:id" element={<CollectionDetailPage />} />
            <Route path="/nft/:id" element={<NFTDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="bottom-right" theme="dark" />
      </div>
    </WalletProvider>
  );
}

export default App;

import { useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import { User } from "./components/User";
import { FloatingWriteButton } from "./components/FloatingWriteButton";
import { ProfileSetupModal } from "./components/ProfileSetupModal";

import { StoryShelf } from "./components/StoryShelf";
import { StoryReader } from "./components/StoryReader";
import { StoryWriter } from "./components/StoryWriter";

import { supabase } from "./utils/supabaseClient";
import type { UserProfile } from "./types/user";
import type { Address } from "viem";

const STORY_CHAIN_ID_HEX = "0x523"; // 1315
const STORY_TESTNET_PARAMS = {
  chainId: STORY_CHAIN_ID_HEX,
  chainName: "Story Aeneid Testnet",
  nativeCurrency: {
    name: "IP",
    symbol: "IP",
    decimals: 18,
  },
  rpcUrls: ["https://aeneid.storyrpc.io"],
  blockExplorerUrls: ["https://testnet.storyscan.app"],
};

function App() {
  const location = useLocation();
  const isStoryPage = location.pathname.startsWith("/story");
  const isWritePage = location.pathname.startsWith("/write");

  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [pendingAddress, setPendingAddress] = useState<Address | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleConnectWallet = async () => {
    if (!window.ethereum) {
      alert("Metamask not found. Please install Metamask extension.");
      return;
    }

    try {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [STORY_TESTNET_PARAMS],
        });
      } catch (err) {
        console.log("wallet_addEthereumChain error (무시 가능):", err);
      }

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: STORY_CHAIN_ID_HEX }],
      });

      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts || accounts.length === 0) return;

      const selected = accounts[0] as Address;
      const message = [
        "Sign in to Story Feed",
        `Address: ${selected}`,
        `Time: ${new Date().toISOString()}`,
      ].join("\n");

      await window.ethereum.request({
        method: "personal_sign",
        params: [message, selected],
      });

      // Supabase에서 해당 주소의 사용자 조회
      if (supabase) {
        try {
          const { data: userData, error } = await supabase
            .from("user")
            .select("address, nickname, avatar_url")
            .eq("address", selected)
            .single();

          if (error && error.code !== "PGRST116") {
            // PGRST116은 "no rows returned" 에러 (사용자가 없는 경우)
            console.error("Failed to fetch user from Supabase:", error);
          }

          if (userData) {
            // 사용자가 존재하면 바로 로그인
            const profile: UserProfile = {
              address: userData.address,
              nickname: userData.nickname,
              avatarUrl: userData.avatar_url || undefined,
            };

            setUserProfile(profile);
            setIsWalletConnected(true);
            return; // 모달을 띄우지 않고 종료
          }
        } catch (error) {
          console.error("Error fetching user from Supabase:", error);
        }
      }

      // 사용자가 없으면 프로필 설정 모달 띄우기
      setPendingAddress(selected);
      setIsProfileModalOpen(true);
    } catch (error) {
      console.error("Wallet connection error:", error);
    }
  };

  const handleDisconnectWallet = () => {
    setIsWalletConnected(false);
    setUserProfile(null);
    setPendingAddress(null);
    setIsProfileModalOpen(false);
  };

  const handleSaveProfile = async (data: {
    nickname: string;
    avatarDataUrl?: string;
  }) => {
    if (!pendingAddress) return;

    const profile: UserProfile = {
      address: pendingAddress,
      nickname: data.nickname,
      avatarUrl: data.avatarDataUrl,
    };

    // Supabase user 테이블에 저장
    if (supabase) {
      try {
        const { error } = await supabase.from("user").upsert(
          {
            address: pendingAddress,
            nickname: data.nickname,
            avatar_url: data.avatarDataUrl || null,
          },
          {
            onConflict: "address", // address가 이미 있으면 업데이트
          }
        );

        if (error) {
          console.error("Failed to save user profile to Supabase:", error);
          // 에러가 발생해도 로컬 상태는 업데이트 (사용자 경험을 위해)
        } else {
          console.log("User profile saved to Supabase successfully");
        }
      } catch (error) {
        console.error("Error saving user profile:", error);
      }
    } else {
      console.warn(
        "Supabase client is not configured. User profile not saved to database."
      );
    }

    setUserProfile(profile);
    setIsWalletConnected(true);
    setPendingAddress(null);
    setIsProfileModalOpen(false);
  };

  const handleCancelProfileSetup = () => {
    setPendingAddress(null);
    setIsProfileModalOpen(false);
    setIsWalletConnected(false);
    setUserProfile(null);
  };

  return (
    <div className="min-h-dvh bg-black text-white pb-16 flex flex-col overflow-x-hidden text-sm md:text-base lg:text-lg">
      <Header profile={userProfile} />
      <main className="flex-1 w-full max-w-full mx-auto overflow-y-auto">
        <Routes>
          <Route path="/" element={<StoryShelf />} />
          <Route
            path="/user"
            element={
              <User
                isWalletConnected={isWalletConnected}
                onConnectWallet={handleConnectWallet}
                onDisconnectWallet={handleDisconnectWallet}
                profile={userProfile ?? undefined}
              />
            }
          />
          <Route path="/story/:id" element={<StoryReader />} />
          <Route
            path="/write"
            element={<StoryWriter profile={userProfile} />}
          />
          <Route
            path="/story/:id/write"
            element={<StoryWriter profile={userProfile} />}
          />
        </Routes>
      </main>
      {!isStoryPage && !isWritePage && isWalletConnected && (
        <FloatingWriteButton />
      )}
      <ProfileSetupModal
        isOpen={isProfileModalOpen}
        address={pendingAddress}
        onCancel={handleCancelProfileSetup}
        onSave={handleSaveProfile}
      />
    </div>
  );
}

export default App;

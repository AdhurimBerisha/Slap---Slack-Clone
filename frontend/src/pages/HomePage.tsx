import { UserButton } from "@clerk/react";
import { useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { useStreamChat } from "../hooks/useStreamChat";
import "../styles/stream-chat-theme.css";
import PageLoader from "../components/PageLoader";
import { HashIcon, PlusIcon, UsersIcon } from "lucide-react";
import UsersList from "../components/UserList";
import CustomChannelPreview from "../components/CustomChannelPreview";
import type { Channel as StreamChannel } from "stream-chat";
import {
  Chat,
  Channel,
  ChannelList,
  type ChannelListMessengerProps,
  MessageList,
  MessageInput,
  Thread,
  Window,
} from "stream-chat-react";
import CustomChannelHeader from "../components/CustomChannelHeader";
import CreateChannelModal from "../components/CreateChannelModal";

const HomePage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { chatClient, error, isLoading } = useStreamChat();
  const currentUserId = chatClient?.user?.id;
  const activeChannel = useMemo(() => {
    if (!chatClient) return undefined;
    const channelId = searchParams.get("channel");
    if (!channelId) return undefined;
    return chatClient.channel("messaging", channelId);
  }, [chatClient, searchParams]);

  if (error) return <p>Something went wrong...</p>;
  if (isLoading || !chatClient) return <PageLoader />;

  return (
    <div className="chat-wrapper">
      <Chat client={chatClient}>
        <div className="chat-container">
          {/* LEFT SIDEBAR */}
          <div className="str-chat__channel-list">
            <div className="team-channel-list">
              {/* HEADER */}
              <div className="team-channel-list__header gap-4">
                <div className="brand-container">
                  <img src="/logo.png" alt="Logo" className="brand-logo" />
                  <span className="brand-name">Slap</span>
                </div>
                <div className="user-button-wrapper">
                  <UserButton />
                </div>
              </div>
              {/* CHANNELS LIST */}
              <div className="team-channel-list__content">
                <div className="create-channel-section">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="create-channel-btn"
                  >
                    <PlusIcon className="size-4" />
                    <span>Create Channel</span>
                  </button>
                </div>

                {/* CHANNEL LIST */}
                <ChannelList
                  filters={
                    currentUserId ? { members: { $in: [currentUserId] } } : {}
                  }
                  options={{ state: true, watch: true }}
                  Preview={({ channel }: { channel: StreamChannel }) => (
                    <CustomChannelPreview
                      channel={channel}
                      activeChannel={activeChannel}
                      setActiveChannel={(channel) =>
                        setSearchParams({ channel: channel.id ?? "" })
                      }
                    />
                  )}
                  List={(listProps: ChannelListMessengerProps) => {
                    const children = (listProps as { children?: ReactNode })
                      .children;

                    return (
                      <div className="channel-sections">
                        <div className="section-header">
                          <div className="section-title">
                            <HashIcon className="size-4" />
                            <span>Channels</span>
                          </div>
                        </div>

                        {/* todos: add better components here instead of just a simple text  */}
                        {listProps.loading && (
                          <div className="loading-message">
                            Loading channels...
                          </div>
                        )}
                        {listProps.error && (
                          <div className="error-message">
                            Error loading channels
                          </div>
                        )}

                        <div className="channels-list">{children}</div>

                        <div className="section-header direct-messages">
                          <div className="section-title">
                            <UsersIcon className="size-4" />
                            <span>Direct Messages</span>
                          </div>
                        </div>
                        <UsersList activeChannel={activeChannel} />
                      </div>
                    );
                  }}
                />
              </div>
            </div>
          </div>

          {/* RIGHT CONTAINER */}
          <div className="chat-main">
            <Channel channel={activeChannel}>
              <Window>
                <CustomChannelHeader />
                <MessageList />
                <MessageInput />
              </Window>

              <Thread />
            </Channel>
          </div>
        </div>

        {isCreateModalOpen && (
          <CreateChannelModal onClose={() => setIsCreateModalOpen(false)} />
        )}
      </Chat>
    </div>
  );
};
export default HomePage;

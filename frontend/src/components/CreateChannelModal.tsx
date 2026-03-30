import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { useChatContext } from "stream-chat-react";
import * as Sentry from "@sentry/react";
import toast from "react-hot-toast";
import type { UserResponse } from "stream-chat";
import {
  AlertCircleIcon,
  HashIcon,
  LockIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";

type CreateChannelModalProps = {
  onClose: () => void;
};

type ChannelType = "public" | "private";

type ChannelCreationData = {
  name: string;
  created_by_id: string;
  members: string[];
  description?: string;
  private?: boolean;
  visibility?: "public" | "private";
  discoverable?: boolean;
};

const CreateChannelModal = ({ onClose }: CreateChannelModalProps) => {
  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState<ChannelType>("public");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [, setSearchParams] = useSearchParams();

  const { client, setActiveChannel } = useChatContext();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!client?.user) return;
      const currentUserId = client.user.id;
      setLoadingUsers(true);

      try {
        const response = await client.queryUsers(
          {},
          { name: 1 },
          { limit: 100 },
        );

        const usersOnly = response.users.filter(
          (user) =>
            user.id !== currentUserId && !user.id.startsWith("recording-"),
        );

        setUsers(usersOnly || []);
      } catch (error) {
        console.log("Error fetching users");
        Sentry.captureException(error, {
          tags: { component: "CreateChannelModal" },
          extra: { context: "fetch_users_for_channel" },
        });
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [client]);

  useEffect(() => {
    if (channelType === "public") {
      setSelectedMembers(
        users
          .map((u) => u.id)
          .filter((id): id is string => typeof id === "string"),
      );
    } else setSelectedMembers([]);
  }, [channelType, users]);

  const validateChannelName = (name: string): string => {
    if (!name.trim()) return "Channel name is required";
    if (name.length < 3) return "Channel name must be at least 3 characters";
    if (name.length > 22) return "Channel name must be less than 22 characters";

    return "";
  };

  const handleChannelNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setChannelName(value);
    setError(validateChannelName(value));
  };

  const handleMemberToggle = (id: string) => {
    if (selectedMembers.includes(id)) {
      setSelectedMembers(selectedMembers.filter((uid) => uid !== id));
    } else {
      setSelectedMembers([...selectedMembers, id]);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationError = validateChannelName(channelName);
    if (validationError) return setError(validationError);

    if (isCreating || !client?.user) return;
    const currentUserId = client.user.id;

    setIsCreating(true);
    setError("");

    try {
      const channelId = channelName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-_]/g, "")
        .slice(0, 20);

      const validMemberIds = Array.from(
        new Set(
          selectedMembers.filter(
            (memberId): memberId is string =>
              typeof memberId === "string" && memberId !== currentUserId,
          ),
        ),
      );

      const channelData: ChannelCreationData = {
        name: channelName.trim(),
        created_by_id: currentUserId,
        members: [currentUserId, ...validMemberIds],
      };

      if (description) channelData.description = description;

      if (channelType === "private") {
        channelData.private = true;
        channelData.visibility = "private";
      } else {
        channelData.visibility = "public";
        channelData.discoverable = true;
      }

      const channel = client.channel("messaging", channelId, channelData);

      await channel.watch();

      setActiveChannel(channel);
      setSearchParams({ channel: channelId });

      toast.success(`Channel "${channelName}" created successfully!`);
      onClose();
    } catch (error) {
      console.log("Error creating the channel", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="create-channel-modal-overlay">
      <div className="create-channel-modal">
        <div className="create-channel-modal__header">
          <h2>Create a channel</h2>
          <button onClick={onClose} className="create-channel-modal__close">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="create-channel-modal__form">
          {error && (
            <div className="form-error">
              <AlertCircleIcon className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Channel name */}
          <div className="form-group">
            <div className="input-with-icon">
              <HashIcon className="w-4 h-4 input-icon" />
              <input
                id="channelName"
                type="text"
                value={channelName}
                onChange={handleChannelNameChange}
                placeholder="e.g. marketing"
                className={`form-input ${error ? "form-input--error" : ""}`}
                autoFocus
                maxLength={22}
              />
            </div>

            {/* channel id  preview */}
            {channelName && (
              <div className="form-hint">
                Channel ID will be: #
                {channelName
                  .toLowerCase()
                  .replace(/\s+/g, "-")
                  .replace(/[^a-z0-9-_]/g, "")}
              </div>
            )}
          </div>

          {/* CHANNEL TYPE */}
          <div className="form-group">
            <label>Channel type</label>

            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  value="public"
                  checked={channelType === "public"}
                  onChange={(e) =>
                    setChannelType(e.target.value as ChannelType)
                  }
                />
                <div className="radio-content">
                  <HashIcon className="size-4" />
                  <div>
                    <div className="radio-title">Public</div>
                    <div className="radio-description">
                      Anyone can join this channel
                    </div>
                  </div>
                </div>
              </label>

              <label className="radio-option">
                <input
                  type="radio"
                  value="private"
                  checked={channelType === "private"}
                  onChange={(e) =>
                    setChannelType(e.target.value as ChannelType)
                  }
                />
                <div className="radio-content">
                  <LockIcon className="size-4" />
                  <div>
                    <div className="radio-title">Private</div>
                    <div className="radio-description">
                      Only invited members can join
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* add members component */}
          {channelType === "private" && (
            <div className="form-group">
              <label>Add members</label>
              <div className="member-selection-header">
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() =>
                    setSelectedMembers(
                      users
                        .map((u) => u.id)
                        .filter((id): id is string => typeof id === "string"),
                    )
                  }
                  disabled={loadingUsers || users.length === 0}
                >
                  <UsersIcon className="w-4 h-4" />
                  Select Everyone
                </button>
                <span className="selected-count">
                  {selectedMembers.length} selected
                </span>
              </div>

              <div className="members-list">
                {loadingUsers ? (
                  <p>Loading users...</p>
                ) : users.length === 0 ? (
                  <p>No users found</p>
                ) : (
                  users
                    .filter(
                      (user): user is UserResponse & { id: string } =>
                        typeof user.id === "string",
                    )
                    .map((user) => (
                      <label key={user.id} className="member-item">
                        <input
                          type="checkbox"
                          checked={Boolean(
                            user.id && selectedMembers.includes(user.id),
                          )}
                          onChange={() => {
                            if (!user.id) return;
                            handleMemberToggle(user.id);
                          }}
                          className="member-checkbox"
                        />
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name || user.id}
                            className="member-avatar"
                          />
                        ) : (
                          <div className="member-avatar member-avatar-placeholder">
                            <span>
                              {(user.name || user.id).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="member-name">
                          {user.name || user.id}
                        </span>
                      </label>
                    ))
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this channel about?"
              className="form-textarea"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="create-channel-modal__actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!channelName.trim() || isCreating}
              className="btn btn-primary"
            >
              {isCreating ? "Creating..." : "Create Channel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;

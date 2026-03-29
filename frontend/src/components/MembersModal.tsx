import { XIcon } from "lucide-react";
import type { ChannelMemberResponse } from "stream-chat";

type MembersModalProps = {
  members: ChannelMemberResponse[];
  onClose: () => void;
};

const MembersModal = ({ members, onClose }: MembersModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-2xl font-semibold">Channel Members</h2>
          <button
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-gray-700"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {members.map((member, index) => {
            const memberUser = member.user;
            const memberId = memberUser?.id || `member-${index}`;
            const displayName = memberUser?.name || memberUser?.id || "Unknown";

            return (
              <div
                key={memberId}
                className="flex items-center gap-3 py-3 border-b last:border-b-0"
              >
                {memberUser?.image ? (
                  <img
                    src={memberUser.image}
                    alt={displayName}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold text-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-medium text-[#1D1C1D]">{displayName}</span>
              </div>
            );
          })}

          {members.length === 0 && (
            <div className="text-center text-gray-500 py-8">No members found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MembersModal;

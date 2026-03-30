import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import toast from "react-hot-toast";

import { getStreamToken } from "../lib/api";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {
  const { id: callId } = useParams();
  const { user, isLoaded } = useUser();

  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<ReturnType<StreamVideoClient["call"]> | null>(
    null,
  );
  const [isConnecting, setIsConnecting] = useState(true);

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!user,
  });

  useEffect(() => {
    let isMounted = true;
    let videoClient: StreamVideoClient | null = null;
    let callInstance: ReturnType<StreamVideoClient["call"]> | null = null;

    const initCall = async () => {
      if (!tokenData?.token || !user || !callId || !STREAM_API_KEY) {
        if (isMounted) setIsConnecting(false);
        return;
      }

      try {
        videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user: {
            id: user.id,
            name: user.fullName ?? user.username ?? user.id,
            image: user.imageUrl,
          },
          token: tokenData.token,
        });

        callInstance = videoClient.call("default", callId);
        await callInstance.join({ create: true });

        if (isMounted) {
          setClient(videoClient);
          setCall(callInstance);
        }
      } catch (error) {
        console.log("Error init call:", error);
        toast.error("Cannot connect to the call.");
      } finally {
        if (isMounted) setIsConnecting(false);
      }
    };

    initCall();
    return () => {
      isMounted = false;
      callInstance?.leave();
      videoClient?.disconnectUser();
    };
  }, [tokenData?.token, user, callId]);

  if (isConnecting || !isLoaded) {
    return (
      <div className="h-screen flex justify-center items-center">
        Connecting to call...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="relative w-full max-w-4xl mx-auto">
        {client && call ? (
          <StreamVideo client={client}>
            <StreamCall call={call}>
              <CallContent />
            </StreamCall>
          </StreamVideo>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>Could not initialize call. Please refresh or try again later</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CallContent = () => {
  const { useCallCallingState } = useCallStateHooks();

  const callingState = useCallCallingState();
  const navigate = useNavigate();

  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      navigate("/");
    }
  }, [callingState, navigate]);

  return (
    <StreamTheme>
      <SpeakerLayout />
      <CallControls />
    </StreamTheme>
  );
};

export default CallPage;

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  Divider,
  Flex,
  Icon,
  Input,
  Stack,
  Tag,
  Text,
  TextArea,
  Tooltip,
} from '@hubspot/ui-extensions';
import {
  createChatSocket,
  createCrmRecord,
  sendPromptRequest,
  updateCrmRecord,
  type CrmRecordStatus,
} from '../../../services/sidebarChatService';
import { useSessionId } from '../../../hooks/useSessionId';

type TranscriptRole = 'assistant' | 'user';

type TranscriptMessage = {
  id: string;
  role: TranscriptRole;
  content: string;
  timestamp: string;
};

type HubSpotExtensionProperties = Record<string, unknown>;

type TranscriptHistoryEntry = {
  id?: string;
  role?: TranscriptRole;
  content?: string;
  timestamp?: string;
};

type HubSpotExtensionContext = {
  object?: {
    id?: string;
    objectTypeId?: string;
    properties?: HubSpotExtensionProperties;
  };
  objectId?: string;
  objectTypeId?: string;
  record?: {
    id?: string;
    objectTypeId?: string;
    properties?: HubSpotExtensionProperties;
  };
  properties?: HubSpotExtensionProperties;
  extensionData?: {
    transcriptHistory?: TranscriptHistoryEntry[];
    sessionId?: string;
    crmRecordId?: string;
    crmRecordStatus?: CrmRecordStatus;
  };
  user?: {
    firstName?: string;
    email?: string;
    id?: string;
  };
};

type PropertyConfig = {
  key: string;
  label: string;
  placeholder?: string;
};

const headerGradient = 'linear-gradient(135deg, #172554 0%, #0f172a 45%, #1e293b 100%)';
const messageGradient = 'linear-gradient(135deg, rgba(46, 86, 207, 0.65), rgba(44, 62, 148, 0.65))';
const userBubbleGradient = 'linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 64, 175, 0.85))';

const toTitleCase = (value: string): string =>
  value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const basePropertyConfig: PropertyConfig[] = [
  { key: 'firstname', label: 'First name' },
  { key: 'lastname', label: 'Last name' },
  { key: 'email', label: 'Email address', placeholder: 'contact@company.com' },
  { key: 'phone', label: 'Phone number', placeholder: '+1 (555) 123-4567' },
  { key: 'company', label: 'Company' },
  { key: 'jobtitle', label: 'Job title', placeholder: 'Operations Manager' },
];

const seededTranscript: TranscriptMessage[] = [
  {
    id: 'intro',
    role: 'assistant',
    content:
      "Hey there! I'm Breeze — your HubSpot AI copilot. Ask me to review this record, enrich missing details, or draft a follow-up.",
    timestamp: new Date().toISOString(),
  },
  {
    id: 'user-followup',
    role: 'user',
    content: "Can you summarize what's missing on this contact record?",
    timestamp: new Date().toISOString(),
  },
  {
    id: 'assistant-gap',
    role: 'assistant',
    content:
      "Looks like we are missing a confirmed phone number and title. I can add what we discussed on the call below — just hit save when you're ready.",
    timestamp: new Date().toISOString(),
  },
];

type BreezeCrmCardAppProps = {
  context: HubSpotExtensionContext;
  actions?: Record<string, unknown>;
};

const BreezeCrmCardApp: React.FC<BreezeCrmCardAppProps> = ({ context }) => {
  const objectProperties: HubSpotExtensionProperties = useMemo(() => {
    const base =
      context.object?.properties ??
      context.record?.properties ??
      context.properties ??
      {};

    return (base ?? {}) as HubSpotExtensionProperties;
  }, [context.object?.properties, context.record?.properties, context.properties]);

  const objectId = context.objectId ?? context.record?.id ?? context.object?.id;
  const objectTypeId = context.objectTypeId ?? context.record?.objectTypeId ?? context.object?.objectTypeId;

  const fallbackSessionId = useSessionId();
  const [sessionId, setSessionId] = useState<string | null>(
    context?.extensionData?.sessionId ?? null,
  );
  const [crmRecordId, setCrmRecordId] = useState<string | null>(
    context?.extensionData?.crmRecordId ?? null,
  );
  const [crmRecordStatus, setCrmRecordStatus] = useState<CrmRecordStatus | null>(
    context?.extensionData?.crmRecordStatus ?? null,
  );
  const [messages, setMessages] = useState<TranscriptMessage[]>(() => {
    const history = context.extensionData?.transcriptHistory ?? [];
    const incoming: TranscriptMessage[] = history.map((entry, index) => {
      const role: TranscriptRole = entry.role === 'user' ? 'user' : 'assistant';

      return {
        id: entry.id ?? `incoming-${index}`,
        role,
        content: entry.content ?? '',
        timestamp: entry.timestamp ?? new Date().toISOString(),
      };
    });

    return incoming.length > 0 ? incoming : seededTranscript;
  });

  const defaultProperties = useMemo(() => {
    const base: Record<string, string> = {};

    basePropertyConfig.forEach(({ key }) => {
      const canonicalKey = key.toLowerCase();
      const propertyValue = objectProperties?.[canonicalKey]?.value ?? objectProperties?.[canonicalKey];
      base[canonicalKey] = propertyValue ?? '';
    });

    return base;
  }, [objectProperties]);

  const [properties, setProperties] = useState<Record<string, string>>(defaultProperties);
  const [draft, setDraft] = useState('');
  const [newPropertyKey, setNewPropertyKey] = useState('');
  const [newPropertyLabel, setNewPropertyLabel] = useState('');
  const [newPropertyValue, setNewPropertyValue] = useState('');
  const [newPropertyKeys, setNewPropertyKeys] = useState<string[]>([]);
  const [customDefinitions, setCustomDefinitions] = useState<PropertyConfig[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const pendingMessagesRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!sessionId && fallbackSessionId) {
      setSessionId(fallbackSessionId);
    }
  }, [fallbackSessionId, sessionId]);

  const stableSessionId = useMemo(
    () => sessionId ?? fallbackSessionId ?? null,
    [sessionId, fallbackSessionId],
  );

  useEffect(() => {
    if (!stableSessionId) {
      return;
    }

    const existingSocket = socketRef.current;
    if (
      existingSocket &&
      (existingSocket.readyState === WebSocket.OPEN ||
        existingSocket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      const socket = createChatSocket(stableSessionId);
      socketRef.current = socket;

      socket.onopen = () => {
      };

      socket.onerror = (event) => {
        console.error('Chat socket error', event);
        socket.close();
      };

      socket.onclose = () => {
        if (socketRef.current === socket) {
          socketRef.current = null;
        }
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          handleSocketMessage(parsed);
        } catch (error) {
          console.error('Failed to parse chat socket payload', error);
        }
      };

      return () => {
        socket.close();
      };
    } catch (error) {
      console.error('Unable to establish chat socket', error);
    }
  }, [stableSessionId, handleSocketMessage]);

  const handleSocketMessage = useCallback(
    (payload: unknown) => {
      if (!payload || typeof payload !== 'object') {
        return;
      }

      const envelope = payload as Record<string, unknown>;
      const type = typeof envelope.type === 'string' ? envelope.type : undefined;
      const nonceValue = envelope.nonce;
      const incomingSessionId = typeof envelope.sessionId === 'string' ? envelope.sessionId : undefined;

      if (incomingSessionId && incomingSessionId.trim().length > 0 && incomingSessionId !== sessionId) {
        setSessionId(incomingSessionId);
      }

      const nonceKey =
        typeof nonceValue === 'string'
          ? nonceValue
          : typeof nonceValue === 'number'
            ? String(nonceValue)
            : null;

      const placeholderId = nonceKey ? pendingMessagesRef.current.get(nonceKey) ?? null : null;

      const finalizeMessage = (content: string) => {
        if (placeholderId && nonceKey) {
          pendingMessagesRef.current.delete(nonceKey);
          setMessages((prev) =>
            prev.map((message) =>
              message.id === placeholderId
                ? {
                    ...message,
                    content,
                    timestamp: new Date().toISOString(),
                  }
                : message,
            ),
          );
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      };

      if (type === 'ack') {
        return;
      }

      if (type === 'response') {
        const replyText =
          typeof envelope.reply === 'string' && envelope.reply.trim().length > 0
            ? envelope.reply
            : 'I did not receive a response, but I am still here if you need anything else.';
        finalizeMessage(replyText);
        setIsStreaming(false);
        return;
      }

      if (type === 'error') {
        const errorMessage =
          typeof envelope.message === 'string' && envelope.message.length > 0
            ? envelope.message
            : 'Something went wrong while processing that request.';
        finalizeMessage(`I hit a snag: ${errorMessage}`);
        setError(errorMessage);
        setIsStreaming(false);
      }
    },
    [sessionId],
  );

  const handleSend = async () => {
    if (!draft.trim()) {
      return;
    }

    const trimmed = draft.trim();
    const nonce = `assistant-${Date.now()}`;

    const nextMessage: TranscriptMessage = {
      id: `draft-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const acknowledgement: TranscriptMessage = {
      id: nonce,
      role: 'assistant',
      content:
        "On it! I'm reviewing the record and will draft the updates in just a second.",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, nextMessage, acknowledgement]);
    setDraft('');
    setFeedback(null);
    setError(null);
    setIsStreaming(true);

    const metadataPayload: Record<string, unknown> = {
      objectId: objectId ?? null,
      objectTypeId: objectTypeId ?? null,
      stagedProperties: properties,
    };

    const outboundSessionId = sessionId ?? stableSessionId ?? undefined;

    const sendWithSocket = () => {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        return false;
      }

      pendingMessagesRef.current.set(nonce, nonce);
      socket.send(
        JSON.stringify({
          type: 'prompt',
          sessionId: outboundSessionId,
          message: trimmed,
          metadata: metadataPayload,
          nonce,
        }),
      );
      return true;
    };

    if (sendWithSocket()) {
      return;
    }

    try {
      const response = await sendPromptRequest({
        sessionId: outboundSessionId,
        message: trimmed,
        metadata: metadataPayload,
      });

      if (response.sessionId && response.sessionId !== sessionId) {
        setSessionId(response.sessionId);
      }

      setMessages((prev) =>
        prev.map((message) =>
          message.id === nonce
            ? {
                ...message,
                content:
                  response.reply?.length > 0
                    ? response.reply
                    : 'I did not receive a response, but I am still here if you need anything else.',
                timestamp: new Date().toISOString(),
              }
            : message,
        ),
      );
    } catch (err: unknown) {
      const messageText =
        err instanceof Error ? err.message : 'Failed to reach the assistant. Please try again.';
      setMessages((prev) =>
        prev.map((message) =>
          message.id === nonce
            ? {
                ...message,
                content: `I ran into an error: ${messageText}`,
                timestamp: new Date().toISOString(),
              }
            : message,
        ),
      );
      setError(messageText);
    } finally {
      setIsStreaming(false);
    }
  };

  const handlePropertyChange = (key: string, value: string) => {
    setProperties((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAddProperty = () => {
    if (!newPropertyKey.trim() || !newPropertyValue.trim()) {
      setError('Provide both an internal name and value for the new property.');
      return;
    }

    const key = newPropertyKey.trim().toLowerCase();

    setProperties((prev) => ({
      ...prev,
      [key]: newPropertyValue.trim(),
    }));

    setNewPropertyKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));

    if (newPropertyLabel.trim()) {
      setCustomDefinitions((prev) => {
        const exists = prev.some((definition) => definition.key === key);
        if (exists) {
          return prev.map((definition) =>
            definition.key === key ? { ...definition, label: newPropertyLabel.trim() } : definition,
          );
        }

        return [...prev, { key, label: newPropertyLabel.trim() }];
      });
    } else {
      setCustomDefinitions((prev) => {
        const exists = prev.some((definition) => definition.key === key);
        return exists ? prev : [...prev, { key, label: toTitleCase(key) }];
      });
    }

    setNewPropertyKey('');
    setNewPropertyLabel('');
    setNewPropertyValue('');
    setError(null);
    setFeedback(`Added ${key} to the update queue.`);
  };

  const handleSaveProperties = async () => {
    setIsSaving(true);
    setError(null);
    setFeedback('Syncing updates with HubSpot...');

    const propertiesToPersist: Record<string, string> = {};

    Object.entries(properties).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        propertiesToPersist[key] = value;
      }
    });

    if (!objectTypeId) {
      setError('Unable to determine the current CRM object type.');
      setIsSaving(false);
      return;
    }

    if (Object.keys(propertiesToPersist).length === 0) {
      setFeedback('Add at least one property update before saving.');
      setIsSaving(false);
      return;
    }

    const confirmationId = `crm-sync-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: confirmationId,
        role: 'assistant',
        content: "Perfect! I'm syncing those updates with HubSpot right now.",
        timestamp: new Date().toISOString(),
      },
    ]);

    const metadataPayload: Record<string, unknown> = {
      source: 'hubspot-sidebar',
      requestedBy: context?.user?.email ?? context?.user?.id ?? null,
      newPropertyKeys,
    };

    try {
      let record = null;

      if (crmRecordId) {
        record = await updateCrmRecord(crmRecordId, {
          objectId: objectId ?? null,
          properties: propertiesToPersist,
          metadata: metadataPayload,
        });
      } else {
        record = await createCrmRecord({
          objectTypeId,
          objectId: objectId ?? null,
          properties: propertiesToPersist,
          metadata: metadataPayload,
        });
        setCrmRecordId(record.id);
      }

      setCrmRecordStatus(record.status);

      if (record.status === 'synced') {
        setFeedback('CRM record synced with HubSpot successfully.');
        setMessages((prev) =>
          prev.map((message) =>
            message.id === confirmationId
              ? {
                  ...message,
                  content:
                    "All set! I published those updates to HubSpot. Want me to prep anything else?",
                  timestamp: new Date().toISOString(),
                }
              : message,
          ),
        );
      } else if (record.status === 'failed') {
        const failureMessage = record.error ?? 'HubSpot rejected the update.';
        setFeedback('Saved your changes, but HubSpot returned an error.');
        setError(failureMessage);
        setMessages((prev) =>
          prev.map((message) =>
            message.id === confirmationId
              ? {
                  ...message,
                  content: `I tried to sync with HubSpot but hit an error: ${failureMessage}`,
                  timestamp: new Date().toISOString(),
                }
              : message,
          ),
        );
      } else {
        setFeedback("Saved your updates. I'll keep working on the HubSpot sync.");
        setMessages((prev) =>
          prev.map((message) =>
            message.id === confirmationId
              ? {
                  ...message,
                  content:
                    "Saved those updates locally. I'll keep nudging HubSpot until everything is published.",
                  timestamp: new Date().toISOString(),
                }
              : message,
          ),
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update HubSpot properties.';
      setError(message);
      setFeedback(null);
      setCrmRecordStatus('failed');
      setMessages((prev) =>
        prev.map((note) =>
          note.id === confirmationId
            ? {
                ...note,
                content: `I couldn't sync those updates: ${message}`,
                timestamp: new Date().toISOString(),
              }
            : note,
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const propertyDefinitions: PropertyConfig[] = useMemo(
    () => {
      const dynamicEntries = customDefinitions.filter(
        (definition) => !basePropertyConfig.some((config) => config.key === definition.key),
      );

      return [...basePropertyConfig, ...dynamicEntries];
    },
    [customDefinitions],
  );

  const readyValueCount = useMemo(
    () =>
      Object.values(properties).filter((value) => {
        if (value === undefined || value === null) {
          return false;
        }
        return String(value).trim().length > 0;
      }).length,
    [properties],
  );

  return (
    <Card backgroundColor="surfacePrimary" style={{ borderRadius: '16px', overflow: 'hidden' }}>
      <Box style={{ background: headerGradient, padding: '16px 20px' }}>
        <Flex
          align="center"
          justify="space-between"
          style={{ columnGap: '16px', rowGap: '16px', flexWrap: 'wrap' }}
        >
          <Flex align="center" style={{ columnGap: '14px' }}>
            <Avatar
              size="md"
              style={{
                background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.9), rgba(14, 116, 144, 0.9))',
                color: '#0f172a',
              }}
            >
              <Icon name="sparkles" />
            </Avatar>
            <Box>
              <Flex align="center" style={{ columnGap: '8px' }}>
                <Text variant="heading-md" color="white">
                  Breeze AI Copilot
                </Text>
                <Tag variant="default" color="green">
                  Live
                </Tag>
              </Flex>
              <Text variant="body-sm" color="rgba(226, 232, 240, 0.85)">
                Guided HubSpot updates with conversational context
              </Text>
            </Box>
          </Flex>
          <Tooltip content="Draft recap, enrich fields, or sync with HubSpot">
            <Tag variant="outline" color="blue">
              {context?.user?.firstName ? `Hi, ${context.user.firstName}` : 'Ready to help'}
            </Tag>
          </Tooltip>
        </Flex>
      </Box>

      <Stack style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Box
          style={{
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(30, 64, 175, 0.65))',
            borderRadius: '14px',
            padding: '16px',
            boxShadow: '0 12px 40px rgba(15, 23, 42, 0.35)',
          }}
        >
          <Text variant="heading-sm" color="white" style={{ marginBottom: '12px' }}>
            Transcript history
          </Text>
          <Divider color="rgba(148, 163, 184, 0.35)" style={{ marginBottom: '12px' }} />
          <Stack
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxHeight: '240px',
              overflowY: 'auto',
            }}
          >
            {messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <Flex
                  key={message.id}
                  justify={isUser ? 'flex-end' : 'flex-start'}
                  style={{ width: '100%' }}
                >
                  <Box
                    style={{
                      maxWidth: '85%',
                      padding: '12px 16px',
                      borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      color: 'white',
                      background: isUser ? userBubbleGradient : messageGradient,
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      boxShadow: '0 18px 32px rgba(15, 23, 42, 0.45)',
                    }}
                  >
                    <Text variant="body-sm" color="rgba(226, 232, 240, 0.95)">
                      {message.content}
                    </Text>
                    <Text variant="caption" color="rgba(148, 163, 184, 0.65)" style={{ marginTop: '8px' }}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </Box>
                </Flex>
              );
            })}
          </Stack>
        </Box>

        <Box
          style={{
            borderRadius: '14px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            boxShadow: '0 12px 30px rgba(30, 64, 175, 0.35)',
            padding: '16px',
          }}
        >
          <Text variant="heading-sm" color="white" style={{ marginBottom: '12px' }}>
            Compose with Breeze
          </Text>
          <TextArea
            placeholder="Ask Breeze to enrich this record, craft a follow-up, or prep CRM updates"
            rows={3}
            value={draft}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(event.target.value)}
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(148, 163, 184, 0.35)',
              color: '#e2e8f0',
            }}
          />
          <Flex justify="space-between" align="center" style={{ marginTop: '12px' }}>
            <Text variant="caption" color="rgba(148, 163, 184, 0.75)">
              Breeze can update HubSpot properties or log notes from your call recap.
            </Text>
            <Button
              variant="primary"
              onClick={handleSend}
              icon={<Icon name="send" />}
              disabled={!draft.trim() || isStreaming}
              loading={isStreaming}
            >
              Send to Breeze
            </Button>
          </Flex>
        </Box>

        <Box
          style={{
            borderRadius: '14px',
            padding: '16px',
            background: 'linear-gradient(180deg, rgba(30, 64, 175, 0.18), rgba(8, 47, 73, 0.55))',
            border: '1px solid rgba(30, 64, 175, 0.35)',
          }}
        >
          <Flex align="center" justify="space-between" style={{ marginBottom: '12px' }}>
            <Text variant="heading-sm" color="white">
              CRM property updates
            </Text>
            <Flex align="center" style={{ columnGap: '8px', rowGap: '8px', flexWrap: 'wrap' }}>
              <Tag variant="outline" color="green">
                {readyValueCount} values ready
              </Tag>
              {crmRecordStatus && (
                <Tag
                  variant="outline"
                  color={crmRecordStatus === 'synced' ? 'green' : crmRecordStatus === 'failed' ? 'red' : 'blue'}
                >
                  {crmRecordStatus === 'synced'
                    ? 'HubSpot synced'
                    : crmRecordStatus === 'failed'
                      ? 'Needs retry'
                      : 'Sync pending'}
                </Tag>
              )}
            </Flex>
          </Flex>

          <Stack style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {propertyDefinitions.map((property) => (
              <Box key={property.key}>
                <Flex justify="space-between" align="center" style={{ marginBottom: '6px' }}>
                  <Text variant="body-sm" color="rgba(226, 232, 240, 0.95)">
                    {property.label}
                  </Text>
                  {newPropertyKeys.includes(property.key) && (
                    <Tag variant="outline" color="blue">
                      New
                    </Tag>
                  )}
                </Flex>
                <Input
                  placeholder={property.placeholder ?? 'Add detail'}
                  value={properties[property.key] ?? ''}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    handlePropertyChange(property.key, event.target.value)
                  }
                  style={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(148, 163, 184, 0.4)',
                    color: '#f8fafc',
                  }}
                />
              </Box>
            ))}
          </Stack>

          <Divider style={{ margin: '18px 0', borderColor: 'rgba(59, 130, 246, 0.25)' }} />

          <Text variant="body-sm" color="rgba(226, 232, 240, 0.95)" style={{ marginBottom: '10px' }}>
            Need to track something new? Add a custom property update below.
          </Text>

          <Flex style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <Input
              placeholder="Internal property name"
              value={newPropertyKey}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setNewPropertyKey(event.target.value)}
              style={{
                flex: 1,
                minWidth: '160px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(148, 163, 184, 0.4)',
                color: '#f8fafc',
              }}
            />
            <Input
              placeholder="Label (optional)"
              value={newPropertyLabel}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setNewPropertyLabel(event.target.value)}
              style={{
                flex: 1,
                minWidth: '140px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(148, 163, 184, 0.4)',
                color: '#f8fafc',
              }}
            />
            <Input
              placeholder="Value"
              value={newPropertyValue}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setNewPropertyValue(event.target.value)}
              style={{
                flex: 1,
                minWidth: '160px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(148, 163, 184, 0.4)',
                color: '#f8fafc',
              }}
            />
            <Button variant="secondary" onClick={handleAddProperty} icon={<Icon name="plus" />}>
              Queue property
            </Button>
          </Flex>

          {error && (
            <Text variant="body-sm" color="#fca5a5" style={{ marginTop: '12px' }}>
              {error}
            </Text>
          )}

          {feedback && (
            <Text variant="body-sm" color="#86efac" style={{ marginTop: '12px' }}>
              {feedback}
            </Text>
          )}

          <Flex
            justify="flex-end"
            style={{ marginTop: '18px', columnGap: '12px', rowGap: '12px', flexWrap: 'wrap' }}
          >
            <Button
              variant="tertiary"
              onClick={() => {
                setProperties(defaultProperties);
                setNewPropertyKeys([]);
                setCustomDefinitions([]);
                setError(null);
                setFeedback('Cleared staged updates.');
              }}
            >
              Reset
            </Button>
            <Button variant="primary" loading={isSaving} onClick={handleSaveProperties} icon={<Icon name="check" />}>
              Save to HubSpot
            </Button>
          </Flex>
        </Box>
      </Stack>
    </Card>
  );
};

export default BreezeCrmCardApp;

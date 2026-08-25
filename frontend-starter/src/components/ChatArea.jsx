import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Flex,
  Icon,
  Avatar,
  InputGroup,
  InputRightElement,
  useToast,
} from "@chakra-ui/react";
import { FiSend, FiInfo, FiMessageCircle } from "react-icons/fi";
import UsersList from "./UsersList";
import { useRef, useState, useEffect } from "react";
import axios from "axios";
import apiURL from "../../utils";

const ChatArea = ({ selectedGroup, socket, setSelectedGroup }) => {
  console.log(selectedGroup?._id);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const toast = useToast();

  const currentUser = JSON.parse(
    localStorage.getItem("userInfo") || "{}"
  );

  useEffect(() => {
    if (selectedGroup && socket) {
      fetchMessages();

      socket.emit("joinRoom", selectedGroup._id);

      socket.on("message received", (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
      });

      socket.on("message deleted", (messageId) => {
        setMessages((prev) =>
          prev.filter((message) => message?._id !== messageId)
        );
      });

      socket.on("onlineUsers", (users) => {
        setOnlineUsers(users);
      });

      socket.on("userJoined", (data) => {
        if (data?.user) {
          setOnlineUsers((prev) => {
            const exists = prev.some(
              (user) => user?._id === data.user?._id
            );

            if (exists) return prev;

            return [...prev, data.user];
          });
        }
      });

      socket.on("userLeft", (userId) => {
        setOnlineUsers((prev) =>
          prev.filter((user) => user?._id !== userId)
        );
      });

      socket.on("user typing", ({ username }) => {
        setTypingUsers((prev) =>
          new Set(prev).add(username)
        );
      });

      socket.on("user stop typing", ({ username }) => {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(username);
          return newSet;
        });
      });

      return () => {
        socket.emit("leaveRoom", selectedGroup._id);

        socket.off("message received");
        socket.off("message deleted");
        socket.off("onlineUsers");
        socket.off("userJoined");
        socket.off("userLeft");
        socket.off("user typing");
        socket.off("user stop typing");

        setOnlineUsers([]);
      };
    }
  }, [selectedGroup, socket]);

  // Fetch messages
  const fetchMessages = async () => {
    const currentUser = JSON.parse(
      localStorage.getItem("userInfo") || "{}"
    );

    const token = currentUser?.token;

    try {
      const { data } = await axios.get(
        `${apiURL}/api/messages/${selectedGroup?._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessages(data);
    } catch (error) {
      console.log(error);
    }
  };

  // Delete message
  const deleteMessage = async (message) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this message?"
    );

    if (!confirmDelete) return;

    try {
      const token = currentUser.token;

      await axios.delete(
        `${apiURL}/api/messages/${message._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessages((prev) =>
        prev.filter((currentMessage) => currentMessage?._id !== message._id)
      );

      socket.emit("message deleted", {
        messageId: message._id,
        groupId: selectedGroup?._id,
      });
    } catch (error) {
      toast({
        title: "Error deleting message",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const token = currentUser.token;

      const { data } = await axios.post(
        `${apiURL}/api/messages`,
        {
          content: newMessage,
          groupId: selectedGroup?._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      socket.emit("new message", {
        ...data,
        groupId: selectedGroup?._id,
      });

      setMessages([...messages, data]);
      setNewMessage("");
    } catch (error) {
      toast({
        title: "Error sending message",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!isTyping && selectedGroup) {
      setIsTyping(true);

      socket.emit("typing", {
        groupId: selectedGroup?._id,
        username: currentUser.username,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (selectedGroup) {
        socket.emit("stop typing", {
          groupId: selectedGroup?.id,
        });
      }

      setIsTyping(false);
    }, 2000);
  };

  // Format time
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Typing indicator
  const renderTypingIndicator = () => {
    if (typingUsers.size === 0) return null;

    const typingUsersArray = Array.from(typingUsers);

    return typingUsersArray?.map((username) => (
      <Box
        key={username}
        alignSelf={
          username === currentUser?.username
            ? "flex-start"
            : "flex-end"
        }
        maxW="70%"
      >
        <Flex
          align="center"
          bg={
            username === currentUser?.username
              ? "#EAF2FF"
              : "#FFFFFF"
          }
          border="1px solid"
          borderColor="#E4EAF2"
          p={2}
          borderRadius="lg"
          gap={2}
          boxShadow="0 2px 8px rgba(50, 70, 100, 0.06)"
        >
          {username === currentUser?.username ? (
            <>
              <Avatar
                size="xs"
                name={username}
                bg="#7EA6D8"
              />

              <Flex align="center" gap={1}>
                <Text
                  fontSize="sm"
                  color="#718096"
                  fontStyle="italic"
                >
                  You are typing
                </Text>

                <Flex gap={1}>
                  {[1, 2, 3].map((dot) => (
                    <Box
                      key={dot}
                      w="3px"
                      h="3px"
                      borderRadius="full"
                      bg="#718096"
                    />
                  ))}
                </Flex>
              </Flex>
            </>
          ) : (
            <>
              <Flex align="center" gap={1}>
                <Text
                  fontSize="sm"
                  color="#718096"
                  fontStyle="italic"
                >
                  {username} is typing
                </Text>

                <Flex gap={1}>
                  {[1, 2, 3].map((dot) => (
                    <Box
                      key={dot}
                      w="3px"
                      h="3px"
                      borderRadius="full"
                      bg="#718096"
                    />
                  ))}
                </Flex>
              </Flex>

              <Avatar
                size="xs"
                name={username}
                bg="#9BB7D4"
              />
            </>
          )}
        </Flex>
      </Box>
    ));
  };

  return (
    <Flex
      h="100%"
      position="relative"
      direction={{ base: "column", lg: "row" }}
      bg="#F1F5F9"
    >

      {/* ================= CHAT SECTION ================= */}

      <Box
        flex="1"
        display="flex"
        flexDirection="column"
        bg="#F7F9FC"
        maxW={{
          base: "100%",
          lg: `calc(100% - 260px)`,
        }}
      >

        {selectedGroup ? (
          <>

            {/* ================= CHAT HEADER ================= */}

            <Flex
              px={6}
              py={4}
              bg="#FFFFFF"
              borderBottom="1px solid"
              borderColor="#E4EAF2"
              align="center"
              boxShadow="0 2px 10px rgba(50, 70, 100, 0.05)"
            >

              <Button
                display={{
                  base: "inline-flex",
                  md: "none",
                }}
                variant="ghost"
                color="#4A5568"
                mr={2}
                onClick={() => setSelectedGroup(null)}
                _hover={{
                  bg: "#EDF2F7",
                }}
              >
                ←
              </Button>

              <Flex
                w="42px"
                h="42px"
                borderRadius="full"
                bg="#E6F0FA"
                align="center"
                justify="center"
                mr={3}
              >
                <Icon
                  as={FiMessageCircle}
                  fontSize="21px"
                  color="#4F7CAC"
                />
              </Flex>

              <Box flex="1">

                <Text
                  fontSize="lg"
                  fontWeight="bold"
                  color="#24324A"
                >
                  {selectedGroup.name}
                </Text>

                <Text
                  fontSize="sm"
                  color="#718096"
                  mt={1}
                >
                  {selectedGroup.description}
                </Text>

              </Box>

              <Icon
                as={FiInfo}
                fontSize="20px"
                color="#94A3B8"
                cursor="pointer"
                _hover={{
                  color: "#4F7CAC",
                }}
                transition="all 0.2s"
              />

            </Flex>


            {/* ================= MESSAGES AREA ================= */}

            <VStack
              flex="1"
              overflowY="auto"
              spacing={4}
              align="stretch"
              px={6}
              py={5}
              position="relative"

              sx={{
                "&::-webkit-scrollbar": {
                  width: "7px",
                },

                "&::-webkit-scrollbar-track": {
                  background: "#F1F5F9",
                },

                "&::-webkit-scrollbar-thumb": {
                  background: "#CBD5E1",
                  borderRadius: "24px",
                },

                "&::-webkit-scrollbar-thumb:hover": {
                  background: "#94A3B8",
                },
              }}
            >

              {messages.map((message) => {

                if (!message?.sender) return null;

                const isCurrentUser =
                  message.sender._id === currentUser?._id;

                return (
                  <Box
                    key={message._id}
                    alignSelf={
                      isCurrentUser
                        ? "flex-end"
                        : "flex-start"
                    }
                    maxW="70%"
                  >

                    <Flex
                      direction="column"
                      gap={1}
                    >

                      {/* Sender Information */}

                      <Flex
                        align="center"
                        mb={1}
                        justifyContent={
                          isCurrentUser
                            ? "flex-end"
                            : "flex-start"
                        }
                        gap={2}
                      >

                        {!isCurrentUser && (
                          <Avatar
                            size="xs"
                            name={message.sender.username}
                            bg="#9BB7D4"
                          />
                        )}

                        <Text
                          fontSize="xs"
                          color="#718096"
                        >
                          {isCurrentUser
                            ? "You"
                            : message.sender.username}
                          {" • "}
                          {formatTime(message.createdAt)}
                        </Text>

                        {isCurrentUser && (
                          <Avatar
                            size="xs"
                            name={message.sender.username}
                            bg="#7EA6D8"
                          />
                        )}

                      </Flex>


                      {/* ================= MESSAGE BUBBLE ================= */}

                      <Box
                        bg={
                          isCurrentUser
                            ? "#DCEBFF"
                            : "#FFFFFF"
                        }

                        color="#24324A"

                        px={4}
                        py={3}

                        borderRadius="18px"

                        border="1px solid"

                        borderColor={
                          isCurrentUser
                            ? "#C5DCF8"
                            : "#E4EAF2"
                        }

                        boxShadow={
                          isCurrentUser
                            ? "0 3px 12px rgba(79, 124, 172, 0.12)"
                            : "0 3px 12px rgba(50, 70, 100, 0.07)"
                        }

                        transition="all 0.2s"

                        _hover={{
                          transform: "translateY(-1px)",
                          boxShadow:
                            "0 5px 15px rgba(50, 70, 100, 0.10)",
                        }}
                      >

                        <Text>
                          {message.content}
                        </Text>

                        {isCurrentUser && (
                          <Button
                            size="xs"
                            variant="link"
                            color="red.400"
                            alignSelf="flex-end"
                            onClick={() => deleteMessage(message)}
                          >
                            Delete
                          </Button>
                        )}

                      </Box>

                    </Flex>

                  </Box>
                );
              })}

              {renderTypingIndicator()}

              <div ref={messagesEndRef} />

            </VStack>


            {/* ================= MESSAGE INPUT ================= */}

            <Box
              p={4}
              bg="#FFFFFF"
              borderTop="1px solid"
              borderColor="#E4EAF2"
              position="relative"
              zIndex="1"
              boxShadow="0 -2px 10px rgba(50, 70, 100, 0.04)"
            >

              <InputGroup size="lg">

                <Input
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Type your message..."
                  pr="4.5rem"

                  color="#24324A"

                  bg="#F7F9FC"

                  border="1px solid"
                  borderColor="#DCE3EC"

                  borderRadius="14px"

                  _placeholder={{
                    color: "#9AA6B2",
                  }}

                  _hover={{
                    borderColor: "#AFC4DB",
                  }}

                  _focus={{
                    boxShadow:
                      "0 0 0 1px #7EA6D8",
                    borderColor: "#7EA6D8",
                    bg: "#FFFFFF",
                  }}

                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      sendMessage();
                    }
                  }}
                />

                <InputRightElement width="4.5rem">

                  <Button
                    h="1.9rem"
                    size="sm"

                    bg="#4F7CAC"

                    color="white"

                    borderRadius="full"

                    _hover={{
                      bg: "#416B98",
                      transform: "translateY(-1px)",
                      boxShadow:
                        "0 4px 12px rgba(79, 124, 172, 0.25)",
                    }}

                    transition="all 0.2s"

                    onClick={sendMessage}
                  >
                    <Icon as={FiSend} />
                  </Button>

                </InputRightElement>

              </InputGroup>

            </Box>

          </>

        ) : (

          /* ================= EMPTY CHAT STATE ================= */

          <Flex
            h="100%"
            direction="column"
            align="center"
            justify="center"
            p={8}
            textAlign="center"
            bg="#F7F9FC"
          >

            <Flex
              w="90px"
              h="90px"
              borderRadius="full"
              bg="#E6F0FA"
              align="center"
              justify="center"
              mb={5}
              boxShadow="0 8px 25px rgba(79, 124, 172, 0.10)"
            >

              <Icon
                as={FiMessageCircle}
                fontSize="42px"
                color="#4F7CAC"
              />

            </Flex>

            <Text
              fontSize="xl"
              fontWeight="bold"
              color="#24324A"
              mb={2}
            >
              Welcome to the Chat
            </Text>

            <Text
              color="#718096"
              maxW="400px"
            >
              Select a group from the sidebar to start
              chatting
            </Text>

          </Flex>

        )}

      </Box>


      {/* ================= MEMBERS SECTION ================= */}

      <Box
        width={{ base: "100%", lg: "260px" }}
        position={{ base: "static", lg: "sticky" }}
        right={0}
        top={0}
        height={{ base: "auto", lg: "100%" }}
        flexShrink={0}
        display={{ base: "none", lg: "block" }}

        bg="#F1F5F9"

        borderLeft="1px solid"
        borderColor="#E4EAF2"
      >

        {selectedGroup && (
          <UsersList
            members={selectedGroup.members || []}
            onlineUsers={onlineUsers}
            currentUser={currentUser}
          />
        )}

      </Box>

    </Flex>
  );
};

export default ChatArea;
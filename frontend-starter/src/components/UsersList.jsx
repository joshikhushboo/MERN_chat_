import {
  Box,
  VStack,
  Text,
  Badge,
  Flex,
  Icon,
  Avatar,
  Divider,
} from "@chakra-ui/react";
import { FiUsers, FiCircle } from "react-icons/fi";

const UsersList = ({ members = [], onlineUsers = [], currentUser }) => {
  // Check whether a member is currently online
  const isUserOnline = (memberId) => {
    return onlineUsers.some((user) => user?._id === memberId);
  };

  // Put current user at the top
  const sortedMembers = [...members].sort((a, b) => {
    if (a?._id === currentUser?._id) return -1;
    if (b?._id === currentUser?._id) return 1;
    return 0;
  });

  const onlineCount = members.filter((member) =>
    isUserOnline(member?._id)
  ).length;

  return (
    <Box
      h="100%"
      w="100%"
      borderLeft="1px solid"
      borderColor="gray.200"
      bg="white"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      {/* Header */}
      <Flex
        p={5}
        borderBottom="1px solid"
        borderColor="gray.200"
        align="center"
        bg="white"
        flexShrink={0}
      >
        <Icon
          as={FiUsers}
          fontSize="20px"
          color="blue.500"
          mr={2}
        />

        <Box flex="1">
          <Flex align="center">
            <Text
              fontSize="lg"
              fontWeight="bold"
              color="gray.700"
            >
              Members
            </Text>

            <Badge
              ml={2}
              colorScheme="blue"
              borderRadius="full"
              px={2}
              py={0.5}
              fontSize="xs"
            >
              {members.length}
            </Badge>
          </Flex>

          <Text fontSize="xs" color="gray.500" mt={1}>
            {onlineCount} {onlineCount === 1 ? "member" : "members"} online
          </Text>
        </Box>
      </Flex>

      {/* Members List */}
      <Box
        flex="1"
        overflowY="auto"
        p={4}
        sx={{
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "gray.200",
            borderRadius: "10px",
          },
        }}
      >
        <VStack align="stretch" spacing={2}>
          {sortedMembers.map((member) => {
            const isCurrentUser =
              member?._id === currentUser?._id;

            const isOnline = isUserOnline(member?._id);

            return (
              <Box key={member?._id}>
                <Flex
                  p={3}
                  borderRadius="lg"
                  align="center"
                  bg={isCurrentUser ? "blue.50" : "white"}
                  border="1px solid"
                  borderColor={
                    isCurrentUser ? "blue.100" : "gray.100"
                  }
                  transition="all 0.2s"
                  _hover={{
                    bg: isCurrentUser ? "blue.50" : "gray.50",
                  }}
                >
                  {/* Avatar + Status */}
                  <Box position="relative" mr={3}>
                    <Avatar
  size="sm"
  name={member?.username}
  src={member?.profilePicture || undefined}
  bg={isCurrentUser ? "blue.500" : "gray.400"}
  color="white"
/>
                    {/* Online dot */}
                    <Box
                      position="absolute"
                      bottom="0"
                      right="0"
                      w="11px"
                      h="11px"
                      borderRadius="full"
                      bg={isOnline ? "green.400" : "gray.300"}
                      border="2px solid white"
                    />
                  </Box>

                  {/* User Information */}
                  <Box flex="1" minW={0}>
                    <Flex align="center" gap={2}>
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="gray.700"
                        noOfLines={1}
                      >
                        {member?.username}
                      </Text>

                      {isCurrentUser && (
                        <Badge
                          colorScheme="blue"
                          variant="subtle"
                          fontSize="9px"
                          borderRadius="full"
                        >
                          You
                        </Badge>
                      )}
                    </Flex>

                    <Text
                      fontSize="xs"
                      color={isOnline ? "green.500" : "gray.400"}
                      mt={0.5}
                    >
                      {isOnline ? "Active" : "Offline"}
                    </Text>
                  </Box>

                  {/* Status */}
                  <Flex
                    align="center"
                    px={2}
                    py={1}
                    borderRadius="full"
                    bg={isOnline ? "green.50" : "gray.50"}
                  >
                    <Icon
                      as={FiCircle}
                      color={isOnline ? "green.400" : "gray.300"}
                      fontSize="7px"
                      mr={1}
                    />

                    <Text
                      fontSize="12px"
                      fontWeight="medium"
                      color={isOnline ? "green.600" : "gray.500"}
                    >
                      {isOnline ? "Online" : "Offline"}
                    </Text>
                  </Flex>
                </Flex>
              </Box>
            );
          })}

          {members.length === 0 && (
            <Flex
              direction="column"
              align="center"
              justify="center"
              py={10}
              color="gray.400"
            >
              <Icon
                as={FiUsers}
                fontSize="30px"
                mb={3}
              />

              <Text fontSize="sm">
                No members found
              </Text>
            </Flex>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default UsersList;
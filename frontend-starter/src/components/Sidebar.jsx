import {
  Box,
  VStack,
  Text,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Flex,
  Icon,
  Badge,
  Tooltip,
  Avatar,
} from "@chakra-ui/react";

import { useEffect, useState } from "react";
import { FiLogOut, FiPlus, FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import apiURL from "../../utils";

const Sidebar = ({ setSelectedGroup }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [groups, setGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);

  const toast = useToast();
  const navigate = useNavigate();
  const [profilePicture, setProfilePicture] = useState("");
  const [uploading, setUploading] = useState(false);

  // Fetch groups when Sidebar loads
  useEffect(() => {
    fetchGroups();
  }, []);

  // Fetch all groups
  const fetchGroups = async () => {
    try {
      const userInfo = JSON.parse(
        localStorage.getItem("userInfo") || "{}"
      );

      const token = userInfo.token;

      if (!token) {
        console.log("No token found");
        return [];
      }

      const { data } = await axios.get(
        `${apiURL}/api/groups`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setGroups(data);

      const userGroupIds = data
        ?.filter((group) =>
          group?.members?.some(
            (member) => member?._id === userInfo?._id
          )
        )
        .map((group) => group?._id);

      setUserGroups(userGroupIds);

      return data;
    } catch (error) {
      console.log("Error fetching groups:", error);
      return [];
    }
  };

  // Create group
  const handleCreateGroup = async () => {
    try {
      if (!newGroupName.trim()) {
        toast({
          title: "Group name is required",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });

        return;
      }

      const userInfo = JSON.parse(
        localStorage.getItem("userInfo") || "{}"
      );

      const token = userInfo.token;

      if (!token) {
        toast({
          title: "You are not logged in",
          status: "error",
          duration: 3000,
          isClosable: true,
        });

        navigate("/login");
        return;
      }

      await axios.post(
        `${apiURL}/api/groups`,
        {
          name: newGroupName.trim(),
          description: newGroupDescription.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast({
        title: "Group Created",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();

      setNewGroupName("");
      setNewGroupDescription("");

      await fetchGroups();
    } catch (error) {
      console.log("Error creating group:", error);

      toast({
        title: "Error Creating Group",
        status: "error",
        duration: 3000,
        isClosable: true,
        description:
          error?.response?.data?.message || "An error occurred",
      });
    }
  };

  // Join group
  const handleJoinGroup = async (groupId) => {
    try {
      const userInfo = JSON.parse(
        localStorage.getItem("userInfo") || "{}"
      );

      const token = userInfo.token;

      await axios.post(
        `${apiURL}/api/groups/${groupId}/join`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedGroups = await fetchGroups();

      const joinedGroup = updatedGroups.find(
        (group) => group?._id === groupId
      );

      if (joinedGroup) {
        setSelectedGroup(joinedGroup);
      }

      toast({
        title: "Joined group successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.log("Error joining group:", error);

      toast({
        title: "Error Joining Group",
        status: "error",
        duration: 3000,
        isClosable: true,
        description:
          error?.response?.data?.message || "An error occurred",
      });
    }
  };

  // Leave group
  const handleLeaveGroup = async (groupId) => {
    try {
      const userInfo = JSON.parse(
        localStorage.getItem("userInfo") || "{}"
      );

      const token = userInfo.token;

      await axios.post(
        `${apiURL}/api/groups/${groupId}/leave`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchGroups();

      setSelectedGroup(null);

      toast({
        title: "Left group successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.log("Error leaving group:", error);

      toast({
        title: "Error Leaving Group",
        status: "error",
        duration: 3000,
        isClosable: true,
        description:
          error?.response?.data?.message || "An error occurred",
      });
    }
  };

  // Delete group - only group admin can do this
const handleDeleteGroup = async (groupId) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this group? This action cannot be undone."
  );

  if (!confirmDelete) {
    return;
  }

  try {
    const userInfo = JSON.parse(
      localStorage.getItem("userInfo") || "{}"
    );

    const token = userInfo.token;

    await axios.delete(
      `${apiURL}/api/groups/${groupId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Close the currently selected chat
    setSelectedGroup(null);

    // Refresh groups
    await fetchGroups();

    toast({
      title: "Group deleted",
      description: "The group was deleted successfully.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });

  } catch (error) {
    console.log("Error deleting group:", error);

    toast({
      title: "Error deleting group",
      description:
        error?.response?.data?.message ||
        "Unable to delete group",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  }
};

const handleProfilePictureUpload = async (e) => {
  const file = e.target.files[0];

  if (!file) return;

  const userInfo = JSON.parse(
    localStorage.getItem("userInfo") || "{}"
  );

  const token = userInfo.token;

  if (!token) {
    toast({
      title: "You are not logged in",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
    return;
  }

  try {
    setUploading(true);

    const formData = new FormData();
    formData.append("profilePicture", file);

    const { data } = await axios.put(
      `${apiURL}/api/users/profile-picture`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setProfilePicture(data.profilePicture);

    // Update localStorage user info
    const updatedUser = {
      ...userInfo,
      profilePicture: data.profilePicture,
    };

    localStorage.setItem(
      "userInfo",
      JSON.stringify(updatedUser)
    );

    toast({
      title: "Profile picture updated!",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  } catch (error) {
    console.error("Profile upload error:", error);

    toast({
      title: "Upload failed",
      description:
        error?.response?.data?.message || "Could not upload image",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  } finally {
    setUploading(false);
  }
};

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  return (
    <Box
      h={{ base: "calc(100vh - 60px)", md: "100%" }}
      bg="#F7F8FC"
      borderRight="1px"
      borderColor="#E7E8F0"
      width={{ base: "100%", md: "300px" }}
      display="flex"
      flexDirection="column"
    >
      {(() => {
  const userInfo = JSON.parse(
    localStorage.getItem("userInfo") || "{}"
  );

  return (
    <Box
      p={4}
      borderBottom="1px solid"
      borderColor="#E7E8F0"
      bg="#FFFFFF"
    >
      <Flex align="center" gap={3}>
        <Avatar
          size="md"
          name={userInfo.username}
          src={profilePicture || userInfo.profilePicture || undefined}
        />

        <Box flex="1">
          <Text
            fontWeight="600"
            color="#303446"
          >
            {userInfo.username}
          </Text>

         <Button
  as="label"
  htmlFor="profile-picture"
  size="sm"
  colorScheme="blue"
  variant="solid"
  cursor="pointer"
  isLoading={uploading}
>
  Change photo
</Button>

          <Input
            id="profile-picture"
            type="file"
            accept="image/*"
            display="none"
            
            onChange={handleProfilePictureUpload}
          />
        </Box>
      </Flex>
    </Box>
  );
})()}

      {/* Header */}
      <Flex
        p={4}
        borderBottom="1px solid"
        borderColor="#E7E8F0"
        bg="#FFFFFF"
        position="sticky"
        top={0}
        zIndex={1}
        align="center"
        justify="space-between"
        boxShadow="0 2px 10px rgba(80, 85, 110, 0.05)"
      >
        <Flex align="center">

          <Icon
            as={FiUsers}
            fontSize="23px"
            color="#7C83FD"
            mr={2}
          />

          <Text
            fontSize="xl"
            fontWeight="700"
            color="#303446"
          >
            Groups
          </Text>

        </Flex>

        <Tooltip
          label="Create New Group"
          placement="right"
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={onOpen}
            borderRadius="full"
            color="#7C83FD"
            _hover={{
              bg: "#EEF0FF",
              transform: "scale(1.08)",
            }}
            transition="all 0.2s"
          >
            <Icon
              as={FiPlus}
              fontSize="20px"
            />
          </Button>
        </Tooltip>

      </Flex>

      {/* Groups List */}
      <Box
        flex="1"
        overflowY="auto"
        p={4}
        mb={{ base: 20, md: 16 }}
        sx={{
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#F7F8FC",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#D9DCEB",
            borderRadius: "20px",
          },
        }}
      >

        <VStack
          spacing={3}
          align="stretch"
        >

          {groups.map((group) => {

            const isJoined = userGroups.includes(group?._id);

const userInfo = JSON.parse(
  localStorage.getItem("userInfo") || "{}"
);

const canDeleteGroup = userInfo?.isAdmin === true || group?.admin?.some(
  (admin) => admin?._id === userInfo?._id
);

            return (
              <Box
                key={group._id}
                p={4}
                cursor="pointer"
                borderRadius="xl"

                bg={
                  isJoined
                    ? "#EEF2FF"
                    : "#FFFFFF"
                }

                borderWidth="1px"

                borderColor={
                  isJoined
                    ? "#C9D2FF"
                    : "#E7E8F0"
                }

                transition="all 0.2s"

                _hover={{
                  transform: "translateY(-2px)",
                  shadow:
                    "0 6px 18px rgba(80, 85, 120, 0.08)",
                  borderColor: "#B8C0FF",
                  bg: "#F5F6FF",
                }}
              >

                <Flex
                  justify="space-between"
                  align="center"
                >

                  {/* Group information */}
                  <Box
                    onClick={() =>
                      isJoined &&
                      setSelectedGroup(group)
                    }
                    flex="1"
                  >

                    <Flex
                      align="center"
                      mb={2}
                    >

                      <Text
                        fontWeight="600"
                        color="#303446"
                      >
                        {group.name}
                      </Text>

                      {isJoined && (
                        <Badge
                          ml={2}
                          bg="#E0E7FF"
                          color="#5961C7"
                          borderRadius="full"
                          px={2}
                          fontSize="10px"
                        >
                          Joined
                        </Badge>
                      )}

                    </Flex>

                    <Text
                      fontSize="sm"
                      color="#7B8195"
                      noOfLines={2}
                    >
                      {group.description}
                    </Text>

                  </Box>

   {/* Group Actions */}
<Flex align="center" gap={2} ml={3}>

  {/* Join / Leave */}
  <Button
    size="sm"
    colorScheme={isJoined ? "red" : "blue"}
    variant={isJoined ? "ghost" : "solid"}
    onClick={() => {
      if (isJoined) {
        handleLeaveGroup(group._id);
      } else {
        handleJoinGroup(group._id);
      }
    }}
    _hover={{
      transform: "scale(1.05)",
      bg: isJoined ? "red.50" : "blue.600",
    }}
    transition="all 0.2s"
  >
    <Text
      fontSize="sm"
      fontWeight="medium"
    >
      {isJoined ? "Leave" : "Join"}
    </Text>
  </Button>

  {/* Delete - GROUP OR APP ADMIN */}
  {canDeleteGroup && (
    <Button
      size="sm"
      colorScheme="red"
      variant="ghost"
      onClick={() => handleDeleteGroup(group._id)}
      _hover={{
        bg: "red.50",
        transform: "scale(1.05)",
      }}
      transition="all 0.2s"
    >
      <Text
        fontSize="sm"
        fontWeight="medium"
      >
        Delete
      </Text>
    </Button>
  )}

</Flex>

                </Flex>

              </Box>
            );
          })}

          {/* No groups */}
          {groups.length === 0 && (
            <Text
              textAlign="center"
              color="#8B90A3"
              fontSize="sm"
              py={6}
            >
              No groups available
            </Text>
          )}

        </VStack>

      </Box>

      {/* Logout */}
      <Box
        p={4}
        borderTop="1px solid"
        borderColor="#E7E8F0"
        bg="#FFFFFF"
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        width={{ base: "100%", md: "300px" }}
        zIndex={2}
      >

        <Button
          variant="ghost"
          onClick={handleLogout}
          color="#E57373"
          width="full"
          justifyContent="flex-start"
          leftIcon={
            <Icon as={FiLogOut} />
          }

          _hover={{
            bg: "#FFF1F2",
            color: "#D95C66",
            transform: "translateY(-1px)",
          }}

          transition="all 0.2s"
        >
          Logout
        </Button>

      </Box>

      {/* Create Group Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
      >

        <ModalOverlay
          backdropFilter="blur(5px)"
          bg="rgba(40, 45, 65, 0.25)"
        />

        <ModalContent
          bg="#FFFFFF"
          color="#303446"
          borderRadius="xl"
          boxShadow="0 15px 50px rgba(50, 55, 80, 0.15)"
        >

          <ModalHeader>
            Create New Group
          </ModalHeader>

          <ModalCloseButton />

          <ModalBody pb={6}>

            {/* Group Name */}
            <FormControl isRequired>

              <FormLabel color="#4A4F63">
                Group Name
              </FormLabel>

              <Input
                value={newGroupName}
                onChange={(e) =>
                  setNewGroupName(
                    e.target.value
                  )
                }

                placeholder="Enter group name"

                bg="#F8F9FD"

                borderColor="#E1E3EC"

                _placeholder={{
                  color: "#A0A5B5",
                }}

                _focus={{
                  borderColor: "#9AA3FF",
                  boxShadow:
                    "0 0 0 1px #9AA3FF",
                  bg: "#FFFFFF",
                }}
              />

            </FormControl>

            {/* Description */}
            <FormControl mt={4}>

              <FormLabel color="#4A4F63">
                Description
              </FormLabel>

              <Input
                value={newGroupDescription}
                onChange={(e) =>
                  setNewGroupDescription(
                    e.target.value
                  )
                }

                placeholder="Enter group description"

                bg="#F8F9FD"

                borderColor="#E1E3EC"

                _placeholder={{
                  color: "#A0A5B5",
                }}

                _focus={{
                  borderColor: "#9AA3FF",
                  boxShadow:
                    "0 0 0 1px #9AA3FF",
                  bg: "#FFFFFF",
                }}
              />

            </FormControl>

            {/* Create Button */}
            <Button
              mt={4}
              width="full"
              onClick={handleCreateGroup}
              bg="#7C83FD"
              color="white"

              _hover={{
                bg: "#6F77F0",
                transform:
                  "translateY(-1px)",
              }}

              transition="all 0.2s"
            >
              Create Group
            </Button>

          </ModalBody>

        </ModalContent>

      </Modal>

    </Box>
  );
};

export default Sidebar;
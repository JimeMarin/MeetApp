import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue, remove, update } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import 'react-calendar/dist/Calendar.css';
import './AdminDash.css';
import Navbar from './AdminNavbar';

const AdminDash = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [searchRoomTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [editRoomForm, setEditRoomForm] = useState({
    roomName: '',
    capacity: 0,
    isAvailable: true,
  });
  const [searchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    isActive: true,
    role: ''
  });
  const navigate = useNavigate();
  const auth = getAuth();
  

  useEffect(() => {
    const db = getDatabase();

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/login');
      }
    });

    const unsubscribeUsers = onValue(ref(db, 'users'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersList = Object.entries(data).map(([id, userData]) => ({
          id,
          ...userData
        }));
        setUsers(usersList);
      } else {
        setUsers([]);
      }
    }, (error) => {
      console.error("Error fetching users:", error);
    });

    const unsubscribeRooms = onValue(ref(db, 'meetingRooms'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const roomsList = Object.entries(data).map(([id, roomData]) => ({
          id,
          ...roomData
        }));
        setRooms(roomsList);
      } else {
        setRooms([]);
      }
    }, (error) => {
      console.error("Error fetching rooms:", error);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUsers();
      unsubscribeRooms();
    };
  }, [navigate, auth]);

  
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setEditForm({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      role: user.role
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (e) => {
    setEditForm(prev => ({ ...prev, isActive: e.target.checked }));
  };

  const handleUpdate = () => {
    if (!selectedUser) return;
    handleEditUser(selectedUser.id, editForm);
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete the user ${selectedUser.email}?`);
    if (confirmDelete) {
      handleDeleteUser(selectedUser.id);
    }
  };

  const handleEditUser = (userId, updatedUserData) => {
    const auth = getAuth();
    const db = getDatabase();
  
    onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {        
        const userRef = ref(db, `users/${userId}`);      
        const updates = {};
        if (updatedUserData.email) updates.email = updatedUserData.email;
        if (updatedUserData.firstName) updates.firstName = updatedUserData.firstName;
        if (updatedUserData.lastName) updates.lastName = updatedUserData.lastName;
        if (updatedUserData.isActive !== undefined) updates.isActive = updatedUserData.isActive;
        if (updatedUserData.role) updates.role = updatedUserData.role;
  
        update(userRef, updates)
          .then(() => {            
            setSelectedUser(null);
            setEditForm({
              email: '',
              firstName: '',
              lastName: '',
              isActive: true,
              role: ''
            });
          })
          .catch((error) => {
            console.error("Error updating user:", error);
            alert(`Error updating user: ${error.message}`);
          });
      } else {
        navigate('/login');
      }
    });
  };

  const handleDeleteUser = (userId) => {
    const auth = getAuth();
    const db = getDatabase();
  
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = ref(db, `users/${userId}`);
        remove(userRef)
          .then(() => {
            alert('User deleted successfully');
            setSelectedUser(null);
            setEditForm({
              email: '',
              firstName: '',
              lastName: '',
              isActive: true,
              role: ''
            });
          })
          .catch((error) => {
            console.error("Error deleting user:", error);
            alert(`Error deleting user: ${error.message}`);
          });
      } else {
        alert("You must be signed in to delete users");
      }
    });
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setEditRoomForm({
      roomName: room.roomName,
      capacity: room.capacity,
      isAvailable: room.isAvailable,
      // Inicializa otros campos aquí
    });
  };

  const handleRoomInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditRoomForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleUpdateRoom = () => {
    if (!selectedRoom) return;

    const db = getDatabase();
    const roomRef = ref(db, `meetingRooms/${selectedRoom.id}`);
    
    update(roomRef, editRoomForm)
      .then(() => {
        alert('Room updated successfully');
        setSelectedRoom(null);
        setEditRoomForm({ roomName: '', capacity: 0, isAvailable: true });
      })
      .catch((error) => {
        console.error("Error updating room:", error);
        alert(`Error updating room: ${error.message}`);
      });
  };

  const handleDeleteRoom = () => {
    if (!selectedRoom) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete the room ${selectedRoom.roomName}?`);
    if (confirmDelete) {
      const db = getDatabase();
      const roomRef = ref(db, `meetingRooms/${selectedRoom.id}`);
      remove(roomRef)
        .then(() => {
          alert('Room deleted successfully');
          setSelectedRoom(null);
          setEditRoomForm({ roomName: '', capacity: 0 });
        })
        .catch((error) => {
          console.error("Error deleting room:", error);
          alert(`Error deleting room: ${error.message}`);
        });
    }
  };

  const filteredRooms = rooms.filter(room => 
    room.roomName.toLowerCase().includes(searchRoomTerm.toLowerCase())
  );

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <Navbar user={user} auth={auth} />
      <hr className="navbar-hr"></hr>
      <div className="dashboard-body">
        <h6>Admin Dashboard</h6>
        <br/><br/>
        <div className="flex-container">
        <div className="box-container">
          <h2 className='title'>Manage Users</h2>
              <div className="box">
                <div>
                  <select className='selector' onChange={(e) => handleUserSelect(JSON.parse(e.target.value))}>
                    <option value="" selected disabled hidden>Select a user</option>
                    {filteredUsers.map(user => (
                      <option key={user.id} value={JSON.stringify(user)}>
                        {user.email}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedUser && (
                  <div>
                    <br/>
                    <form className='form'>
                      <input
                        name="email"
                        className='input-form'
                        value={editForm.email}
                        onChange={handleInputChange}
                        placeholder="Email"
                      />
                      <input
                        name="firstName"
                        className='input-form'
                        value={editForm.firstName}
                        onChange={handleInputChange}
                        placeholder="First Name"
                      />
                      <input
                        name="lastName"
                        className='input-form'
                        value={editForm.lastName}
                        onChange={handleInputChange}
                        placeholder="Last Name"
                      />
                      <div>
                        <label>Active:</label>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={editForm.isActive}
                            onChange={handleToggleChange}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                      <label>Role:</label>
                      <input
                        name="role"
                        className='input-form'
                        value={editForm.role}
                        onChange={handleInputChange}
                        placeholder="Role"
                      />
                      <button type="button" className='edit-button' onClick={handleUpdate}>Update User</button>
                      <button type="button" className='edit-button' onClick={handleDelete}>Delete User</button>
                    </form>
                  </div>
                )}
              </div>
        </div>
            <div className="box-container">
              <h2 className='title'>Manage Meeting Rooms</h2>
                <div className="box-2">
                  <div>
                    <select className='selector' onChange={(e) => handleRoomSelect(JSON.parse(e.target.value))}>
                      <option value="" selected disabled hidden>Select a room</option>
                      {filteredRooms.map(room => (
                        <option key={room.id} value={JSON.stringify(room)}>
                          {room.roomName}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedRoom && (
                    <div>
                      <br/>
                      <form className='form'>
                        <input
                          name="roomName"
                          className='input-form'
                          value={editRoomForm.roomName}
                          onChange={handleRoomInputChange}
                          placeholder="Room Name"
                        />
                        <input
                          type="number"
                          className='input-form'
                          name="capacity"
                          value={editRoomForm.capacity}
                          onChange={handleRoomInputChange}
                          placeholder="Capacity"
                        />
                        <div>
                          <label>Available:</label>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              name="isAvailable"
                              checked={editRoomForm.isAvailable}
                              onChange={handleRoomInputChange}
                            />
                            <span className="slider"></span>
                          </label>
                        </div>
                        {/* Add more fields here if necessary */}
                        <button type="button" className='edit-button' onClick={handleUpdateRoom}>Update Room</button>
                        <button type="button" className='edit-button' onClick={handleDeleteRoom}>Delete Room</button>
                      </form>
                    </div>
                  )}
                </div>
            </div>
        </div>
      </div>
    </div>    
  );
};

export default AdminDash;
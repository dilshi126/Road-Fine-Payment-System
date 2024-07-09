// scripts.js

function showLogin() {
    document.getElementById('homepage').style.display = 'none';
    document.getElementById('loginPage').style.display = 'block';
  }
  
  function showPayment() {
    document.getElementById('homepage').style.display = 'none';
    document.getElementById('paymentPage').style.display = 'block';
  }
  
  function showCreateAccount() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('createAccountPage').style.display = 'block';
  }
  
  function showAdminLogin() {
    document.getElementById('homepage').style.display = 'none';
    document.getElementById('adminLoginPage').style.display = 'block';
  }
  
  function showAddOfficer() {
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('addOfficerPage').style.display = 'block';
  }
  
  document.getElementById('loginForm').onsubmit = function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
  
    fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
      if (data.token) {
        localStorage.setItem('token', data.token);
        alert('Login successful');
        // Redirect to officer dashboard or perform other actions
      } else {
        alert('Login failed');
      }
    })
    .catch(error => console.error('Error:', error));
  };
  
  document.getElementById('createAccountForm').onsubmit = function(event) {
    event.preventDefault();
    const officerID = document.getElementById('officerID').value;
    const policeID = document.getElementById('policeID').value;
    const username = document.getElementById('usernameCreate').value;
    const password = document.getElementById('passwordCreate').value;
  
    fetch('/api/createAccount', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ officerID, policeID, username, password })
    })
    .then(response => response.json())
    .then(data => {
      if (data.message === 'Account created successfully') {
        alert('Account created successfully');
        showLogin();
      } else {
        alert('Account creation failed');
      }
    })
    .catch(error => console.error('Error:', error));
  };
  
  document.getElementById('paymentForm').onsubmit = function(event) {
    event.preventDefault();
    const licenseNumber = document.getElementById('licenseNumber').value;
  
    fetch(`/api/fines/${licenseNumber}`)
    .then(response => response.json())
    .then(data => {
      if (data.fineAmount) {
        document.getElementById('fineDetails').style.display = 'block';
        document.getElementById('fineAmount').innerText = `Fine Amount: ${data.fineAmount}`;
        document.getElementById('fineId').value = data.id; // Assuming the fine ID is returned in the response
      } else {
        alert('No unpaid fines found');
      }
    })
    .catch(error => console.error('Error:', error));
  };
  
  document.getElementById('adminLoginForm').onsubmit = function(event) {
    event.preventDefault();
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
  
    fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
      if (data.token) {
        localStorage.setItem('adminToken', data.token);
        alert('Admin login successful');
        // Redirect to admin dashboard or perform other actions
      } else {
        alert('Admin login failed');
      }
    })
    .catch(error => console.error('Error:', error));
  };
  
  document.getElementById('addOfficerForm').onsubmit = function(event) {
    event.preventDefault();
    const officerID = document.getElementById('newOfficerID').value;
    const policeID = document.getElementById('newPoliceID').value;
    const name = document.getElementById('newOfficerName').value;
  
    fetch('/api/admin/addOfficer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ officerID, policeID, name })
    })
    .then(response => response.json())
    .then(data => {
      if (data.message === 'Officer added successfully') {
        alert('Officer added successfully');
        // Refresh officer list or perform other actions
      } else {
        alert('Adding officer failed');
      }
    })
    .catch(error => console.error('Error:', error));
  };
  
  function payFine() {
    const fineId = document.getElementById('fineId').value;
  
    fetch('/api/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fineId, amountPaid: document.getElementById('fineAmount').innerText.split(': ')[1] })
    })
    .then(response => response.json())
    .then(data => {
      if (data.message === 'Payment successful and notification sent') {
        alert('Payment successful');
        // Redirect to payment confirmation or perform other actions
      } else {
        alert('Payment failed');
      }
    })
    .catch(error => console.error('Error:', error));
  }
  
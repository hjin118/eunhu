// P학원 회원 관리 시스템

class DataManager {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem('eunhu_members')) {
            localStorage.setItem('eunhu_members', JSON.stringify([]));
        }
        if (!localStorage.getItem('eunhu_classes')) {
            localStorage.setItem('eunhu_classes', JSON.stringify([]));
        }
        if (!localStorage.getItem('eunhu_backup_logs')) {
            localStorage.setItem('eunhu_backup_logs', JSON.stringify([]));
        }
    }

    loadMembers() {
        return JSON.parse(localStorage.getItem('eunhu_members') || '[]');
    }

    saveMembers(members) {
        localStorage.setItem('eunhu_members', JSON.stringify(members));
    }

    addMember(member) {
        const members = this.loadMembers();
        member.id = Date.now();
        member.registeredDate = new Date().toISOString().split('T')[0];
        member.attendance = [];
        member.payments = [];
        member.counseling = [];
        member.progress = [];
        members.push(member);
        this.saveMembers(members);

        // 수강반에 회원 자동 배정
        if (member.classId) {
            this.assignMemberToClass(member.classId, member.id);
        }

        return member;
    }

    updateMember(id, updatedData) {
        const members = this.loadMembers();
        const index = members.findIndex(m => m.id === id);
        if (index !== -1) {
            const oldClassId = members[index].classId;
            const newClassId = updatedData.classId;
            
            members[index] = { ...members[index], ...updatedData };
            this.saveMembers(members);

            // 수강반 변경 처리
            if (newClassId !== oldClassId) {
                // 이전 수강반에서 제거
                if (oldClassId) {
                    const classes = this.loadClasses();
                    const clsIndex = classes.findIndex(c => c.id === oldClassId);
                    if (clsIndex !== -1) {
                        classes[clsIndex].members = classes[clsIndex].members.filter(mid => mid !== id);
                        this.saveClasses(classes);
                    }
                }
                
                // 새 수강반에 추가
                if (newClassId) {
                    this.assignMemberToClass(newClassId, id);
                }
            }

            return members[index];
        }
        return null;
    }

    deleteMember(id) {
        const members = this.loadMembers();
        const member = members.find(m => m.id === id);
        
        // 수강반에서 제거
        if (member && member.classId) {
            const classes = this.loadClasses();
            const clsIndex = classes.findIndex(c => c.id === member.classId);
            if (clsIndex !== -1) {
                classes[clsIndex].members = classes[clsIndex].members.filter(mid => mid !== id);
                this.saveClasses(classes);
            }
        }
        
        // 회원 삭제
        this.saveMembers(members.filter(m => m.id !== id));
    }

    getMember(id) {
        const members = this.loadMembers();
        return members.find(m => m.id === id);
    }

    loadClasses() {
        return JSON.parse(localStorage.getItem('eunhu_classes') || '[]');
    }

    saveClasses(classes) {
        localStorage.setItem('eunhu_classes', JSON.stringify(classes));
    }

    addClass(classData) {
        const classes = this.loadClasses();
        classData.id = Date.now();
        classData.members = [];
        classData.createdDate = new Date().toISOString().split('T')[0];
        classes.push(classData);
        this.saveClasses(classes);
        return classData;
    }

    deleteClass(id) {
        const classes = this.loadClasses().filter(c => c.id !== id);
        this.saveClasses(classes);
        
        const members = this.loadMembers();
        members.forEach(member => {
            if (member.classId === id) {
                member.classId = null;
            }
        });
        this.saveMembers(members);
    }

    updateClass(id, updatedData) {
        const classes = this.loadClasses();
        const index = classes.findIndex(c => c.id === id);
        if (index !== -1) {
            classes[index] = { ...classes[index], ...updatedData };
            this.saveClasses(classes);
            return classes[index];
        }
        return null;
    }

    getClass(id) {
        const classes = this.loadClasses();
        return classes.find(c => c.id === id);
    }

    assignMemberToClass(classId, memberId) {
        const classes = this.loadClasses();
        const clsIndex = classes.findIndex(c => c.id === classId);
        
        if (clsIndex === -1) return false;
        
        if (!classes[clsIndex].members.includes(memberId)) {
            classes[clsIndex].members.push(memberId);
            this.saveClasses(classes);
        }

        const members = this.loadMembers();
        const memberIndex = members.findIndex(m => m.id === memberId);
        
        if (memberIndex !== -1) {
            members[memberIndex].classId = classId;
            this.saveMembers(members);
        }

        return true;
    }

    removeMemberFromClass(classId, memberId) {
        const classes = this.loadClasses();
        const clsIndex = classes.findIndex(c => c.id === classId);
        
        if (clsIndex === -1) return false;
        
        classes[clsIndex].members = classes[clsIndex].members.filter(id => id !== memberId);
        this.saveClasses(classes);

        const members = this.loadMembers();
        const memberIndex = members.findIndex(m => m.id === memberId);
        
        if (memberIndex !== -1) {
            members[memberIndex].classId = null;
            this.saveMembers(members);
        }

        return true;
    }

    exportData() {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            members: this.loadMembers(),
            metadata: {
                totalMembers: this.loadMembers().length,
                dataSize: JSON.stringify(this.loadMembers()).length
            }
        };
        return JSON.stringify(data, null, 2);
    }

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            if (!data.members || !Array.isArray(data.members)) {
                throw new Error('유효하지 않은 데이터 형식입니다.');
            }
            
            this.saveMembers(data.members);
            
            return {
                success: true,
                message: '데이터가 성공적으로 복구되었습니다.',
                importedCount: data.members.length
            };
        } catch (error) {
            return {
                success: false,
                message: '데이터 복구 실패: ' + error.message
            };
        }
    }

    resetData() {
        this.saveMembers([]);
    }

    getBackupLogs() {
        return JSON.parse(localStorage.getItem('eunhu_backup_logs') || '[]');
    }

    addBackupLog(type, details) {
        const logs = this.getBackupLogs();
        const log = {
            id: Date.now(),
            type,
            timestamp: new Date().toISOString(),
            details
        };
        
        logs.unshift(log);
        
        if (logs.length > 50) {
            logs.pop();
        }
        
        localStorage.setItem('eunhu_backup_logs', JSON.stringify(logs));
        return log;
    }
}

class App {
    constructor() {
        this.dataManager = new DataManager();
        this.selectedMemberId = null;
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.attendanceFilter = 'all';
        this.paymentFilter = 'all';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupMembersTab();
    }

    setupEventListeners() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                navButtons.forEach(b => b.classList.remove('active'));
                tabContents.forEach(t => t.classList.remove('active'));
                
                e.target.classList.add('active');
                const tabId = e.target.dataset.tab + '-tab';
                const tabElement = document.getElementById(tabId);
                
                if (tabElement) {
                    tabElement.classList.add('active');
                    
                    if (tabId === 'members-tab') {
                        this.setupMembersTab();
                    }
                    if (tabId === 'attendance-tab') {
                        this.setupAttendanceTab();
                    }
                    if (tabId === 'progress-tab') {
                        this.setupProgressTab();
                    }
                    if (tabId === 'payment-tab') {
                        this.setupPaymentTab();
                    }
                    if (tabId === 'counseling-tab') {
                        this.setupCounselingTab();
                    }
                    if (tabId === 'dashboard-tab') {
                        this.setupDashboard();
                    }
                    if (tabId === 'backup-tab') {
                        this.setupBackupTab();
                    }
                    if (tabId === 'classes-tab') {
                        this.setupClassesTab();
                    }
                }
            });
        });
    }

    setupMembersTab() {
        const registrationForm = document.querySelector('.registration-form');
        if (registrationForm && !registrationForm.dataset.hasListener) {
            registrationForm.addEventListener('submit', (e) => this.handleMemberSubmit(e));
            registrationForm.dataset.hasListener = 'true';
        }

        const searchInput = document.getElementById('search');
        if (searchInput && !searchInput.dataset.hasListener) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.renderMembers();
            });
            searchInput.dataset.hasListener = 'true';
        }

        const memberList = document.getElementById('member-list');
        if (memberList && !memberList.dataset.hasListener) {
            memberList.addEventListener('click', (e) => this.handleMemberListClick(e));
            memberList.dataset.hasListener = 'true';
        }

        this.populateClassSelect();
        this.renderMembers();
    }

    populateClassSelect() {
        const select = document.getElementById('class');
        const classes = this.dataManager.loadClasses();
        
        select.innerHTML = '<option value="">선택</option>' + 
            classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    handleMemberSubmit(e) {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const school = document.getElementById('school').value.trim();
        const grade = document.getElementById('grade').value;
        const classId = document.getElementById('class').value;

        if (!name || !phone) {
            alert('이름과 연락처는 필수 항목입니다.');
            return;
        }

        const member = {
            name,
            phone,
            school,
            grade,
            classId: classId ? parseInt(classId) : null
        };

        this.dataManager.addMember(member);
        
        document.querySelector('.registration-form').reset();
        this.renderMembers();
        this.populateAllSelects();
        
        alert('회원이 등록되었습니다.');
    }

    handleMemberListClick(e) {
        const memberCard = e.target.closest('.member-card');
        if (!memberCard) return;

        const memberId = parseInt(memberCard.dataset.id);
        
        if (e.target.closest('.delete-btn')) {
            e.stopPropagation();
            this.deleteMember(memberId);
            return;
        }

        this.selectedMemberId = memberId;
        this.renderMembers();
        this.renderMemberDetail(memberId);
    }

    renderMembers() {
        const memberList = document.getElementById('member-list');
        const members = this.dataManager.loadMembers();
        
        let filteredMembers = members;

        if (this.currentFilter === 'unpaid') {
            filteredMembers = members.filter(m => this.isUnpaid(m));
        }

        if (this.searchTerm) {
            filteredMembers = filteredMembers.filter(m => 
                m.name.toLowerCase().includes(this.searchTerm) ||
                m.phone.includes(this.searchTerm)
            );
        }

        if (filteredMembers.length === 0) {
            memberList.innerHTML = `
                <div class="empty-state">
                    <p>${this.searchTerm ? '검색 결과가 없습니다.' : '등록된 회원이 없습니다.'}</p>
                </div>
            `;
            return;
        }

        memberList.innerHTML = filteredMembers.map(member => {
            const isSelected = member.id === this.selectedMemberId;
            const isUnpaid = this.isUnpaid(member);
            
            return `
                <div class="member-card ${isSelected ? 'selected' : ''} ${isUnpaid ? 'unpaid' : ''}" data-id="${member.id}">
                    <div class="member-card-header">
                        <div class="member-card-name">${member.name}</div>
                        <div class="member-card-phone">${member.phone}</div>
                    </div>
                    <div class="member-card-info">
                        <span>${member.school || '-'}</span>
                        <span>${member.grade ? member.grade + '학년' : '-'}</span>
                    </div>
                    <button class="btn btn-danger delete-btn">삭제</button>
                </div>
            `;
        }).join('');
    }

    renderMemberDetail(memberId) {
        const detailCard = document.getElementById('detail-card');
        const member = this.dataManager.getMember(memberId);

        if (!member) {
            detailCard.innerHTML = `
                <div class="empty-state">
                    <p>회원을 선택하면 상세 정보가 표시됩니다.</p>
                </div>
            `;
            return;
        }

        const unpaidStatus = this.isUnpaid(member);
        const attendanceRate = this.calculateAttendanceRate(member);
        
        // 수강반 정보 가져오기
        let className = '-';
        if (member.classId) {
            const cls = this.dataManager.getClass(member.classId);
            className = cls ? cls.name : '-';
        }

        detailCard.innerHTML = `
            <div class="detail-header">
                <div>
                    <h3>${member.name}</h3>
                    <div class="phone">${member.phone}</div>
                </div>
                <button class="btn btn-danger" onclick="app.deleteMember(${member.id})">회원 삭제</button>
            </div>
 
            <div class="detail-info">
                <div class="detail-info-item">
                    <span class="detail-info-label">학교</span>
                    <span class="detail-info-value">${member.school || '-'}</span>
                </div>
                <div class="detail-info-item">
                    <span class="detail-info-label">학년</span>
                    <span class="detail-info-value">${member.grade ? member.grade + '학년' : '-'}</span>
                </div>
                <div class="detail-info-item">
                    <span class="detail-info-label">수강반</span>
                    <span class="detail-info-value">${className}</span>
                </div>
                <div class="detail-info-item">
                    <span class="detail-info-label">등록일</span>
                    <span class="detail-info-value">${member.registeredDate}</span>
                </div>
                <div class="detail-info-item">
                    <span class="detail-info-label">출석률</span>
                    <span class="detail-info-value">${attendanceRate}%</span>
                </div>
                <div class="detail-info-item">
                    <span class="detail-info-label">결제 상태</span>
                    <span class="detail-info-value">
                        <span class="status-badge ${unpaidStatus ? 'status-unpaid' : 'status-paid'}">
                            ${unpaidStatus ? '미납' : '완료'}
                        </span>
                    </span>
                </div>
            </div>

            <div class="detail-sections">
                <div>
                    <div class="detail-section-title">정보 수정</div>
                    <form id="edit-form" class="form">
                        <div class="form-group">
                            <label>이름</label>
                            <input type="text" id="edit-name" value="${member.name}" required>
                        </div>
                        <div class="form-group">
                            <label>연락처</label>
                            <input type="tel" id="edit-phone" value="${member.phone}" required>
                        </div>
                        <div class="form-group">
                            <label>학교</label>
                            <input type="text" id="edit-school" value="${member.school || ''}">
                        </div>
                        <div class="form-group">
                            <label>학년</label>
                            <select id="edit-grade">
                                <option value="">선택</option>
                                <option value="1" ${member.grade == 1 ? 'selected' : ''}>1학년</option>
                                <option value="2" ${member.grade == 2 ? 'selected' : ''}>2학년</option>
                                <option value="3" ${member.grade == 3 ? 'selected' : ''}>3학년</option>
                                <option value="4" ${member.grade == 4 ? 'selected' : ''}>4학년</option>
                                <option value="5" ${member.grade == 5 ? 'selected' : ''}>5학년</option>
                                <option value="6" ${member.grade == 6 ? 'selected' : ''}>6학년</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>수강반</label>
                            <select id="edit-class">
                                <option value="">선택 안함</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary">수정 완료</button>
                    </form>
                </div>
            </div>
        `;

        // 수강반 선택 옵션 채우기
        this.populateEditClassSelect(member.classId);

        document.getElementById('edit-form').addEventListener('submit', (e) => this.handleEditSubmit(e, member.id));
    }

    handleEditSubmit(e, memberId) {
        e.preventDefault();

        const updatedData = {
            name: document.getElementById('edit-name').value.trim(),
            phone: document.getElementById('edit-phone').value.trim(),
            school: document.getElementById('edit-school').value.trim(),
            grade: document.getElementById('edit-grade').value,
            classId: document.getElementById('edit-class').value ? parseInt(document.getElementById('edit-class').value) : null
        };

        this.dataManager.updateMember(memberId, updatedData);
        this.renderMembers();
        this.renderMemberDetail(memberId);
        
        alert('회원 정보가 수정되었습니다.');
    }

    populateEditClassSelect(classId = null) {
        const select = document.getElementById('edit-class');
        const classes = this.dataManager.loadClasses();
        
        select.innerHTML = '<option value="">선택 안함</option>' + 
            classes.map(c => `<option value="${c.id}" ${classId === c.id ? 'selected' : ''}>${c.name}</option>`).join('');
    }

    deleteMember(id) {
        if (confirm('정말로 이 회원을 삭제하시겠습니까?')) {
            this.dataManager.deleteMember(id);
            this.selectedMemberId = null;
            this.renderMembers();
            
            const detailCard = document.getElementById('detail-card');
            detailCard.innerHTML = `
                <div class="empty-state">
                    <p>회원을 선택하면 상세 정보가 표시됩니다.</p>
                </div>
            `;
        }
    }

    isUnpaid(member) {
        if (!member.payments || member.payments.length === 0) return false;
        return member.payments.some(p => p.status === 'unpaid');
    }

    calculateAttendanceRate(member) {
        if (!member.attendance || member.attendance.length === 0) return 0;
        const present = member.attendance.filter(a => a.status === 'present').length;
        const total = member.attendance.length;
        return Math.round((present / total) * 100);
    }

    setupAttendanceTab() {
        const attendanceDate = document.getElementById('attendance-date');
        if (attendanceDate) {
            attendanceDate.valueAsDate = new Date();
            if (!attendanceDate.dataset.hasListener) {
                attendanceDate.addEventListener('change', () => this.renderAttendance());
                attendanceDate.dataset.hasListener = 'true';
            }
        }

        this.populateAttendanceMemberSelect();
        this.setupAttendanceButtons();
        this.renderAttendance();
    }

    setupAttendanceButtons() {
        const attendanceMember = document.getElementById('attendance-member');
        if (attendanceMember && !attendanceMember.dataset.hasListener) {
            attendanceMember.addEventListener('change', () => {
                const memberId = parseInt(attendanceMember.value);
                this.enableAttendanceButtons(!!memberId);
            });
            attendanceMember.dataset.hasListener = 'true';
        }

        const attendanceActions = document.querySelectorAll('.attendance-actions button');
        attendanceActions.forEach(btn => {
            if (!btn.dataset.hasListener) {
                btn.addEventListener('click', () => {
                    const status = btn.dataset.status;
                    const memberId = parseInt(document.getElementById('attendance-member').value);
                    const date = document.getElementById('attendance-date').value;
                    
                    if (!memberId || !date) {
                        alert('날짜와 회원을 선택해주세요.');
                        return;
                    }

                    this.recordAttendance(memberId, date, status);
                });
                btn.dataset.hasListener = 'true';
            }
        });

        const filterButtons = document.querySelectorAll('.attendance-list .filter-btn');
        filterButtons.forEach(btn => {
            if (!btn.dataset.hasListener) {
                btn.addEventListener('click', () => {
                    filterButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.attendanceFilter = btn.dataset.filter;
                    this.renderAttendanceRecords();
                });
                btn.dataset.hasListener = 'true';
            }
        });
    }

    enableAttendanceButtons(enabled) {
        const buttons = document.querySelectorAll('.attendance-actions button');
        buttons.forEach(btn => {
            btn.disabled = !enabled;
            btn.style.opacity = enabled ? '1' : '0.5';
            btn.style.cursor = enabled ? 'pointer' : 'not-allowed';
        });
    }

    populateAttendanceMemberSelect() {
        const select = document.getElementById('attendance-member');
        const members = this.dataManager.loadMembers();
        
        select.innerHTML = '<option value="">회원 선택</option>' + 
            members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        
        this.enableAttendanceButtons(false);
    }

    recordAttendance(memberId, date, status) {
        const members = this.dataManager.loadMembers();
        const memberIndex = members.findIndex(m => m.id === memberId);
        
        if (memberIndex === -1) return;

        const existingRecordIndex = members[memberIndex].attendance.findIndex(
            a => a.date === date
        );

        if (existingRecordIndex !== -1) {
            members[memberIndex].attendance[existingRecordIndex].status = status;
        } else {
            members[memberIndex].attendance.push({
                date,
                status,
                timestamp: Date.now()
            });
        }

        this.dataManager.saveMembers(members);
        this.renderAttendance();
        
        const statusText = { present: '출석', absent: '결석', late: '지각' }[status];
        alert(`${statusText}이 기록되었습니다.`);
    }

    renderAttendance() {
        this.renderAttendanceRecords();
        this.renderAttendanceStats();
    }

    renderAttendanceRecords() {
        const container = document.getElementById('attendance-records');
        const members = this.dataManager.loadMembers();
        const selectedDate = document.getElementById('attendance-date').value;
        
        let allRecords = [];
        
        members.forEach(member => {
            member.attendance.forEach(record => {
                allRecords.push({
                    memberName: member.name,
                    memberPhone: member.phone,
                    ...record
                });
            });
        });

        allRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (this.attendanceFilter && this.attendanceFilter !== 'all') {
            allRecords = allRecords.filter(r => r.status === this.attendanceFilter);
        }

        if (allRecords.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>출결 기록이 없습니다.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = allRecords.map(record => {
            const statusClass = `status-${record.status}`;
            const statusText = { present: '출석', absent: '결석', late: '지각' }[record.status];
            
            return `
                <div class="attendance-record">
                    <div class="attendance-record-info">
                        <div class="attendance-record-name">${record.memberName}</div>
                        <div class="attendance-record-details">
                            ${record.date} | ${record.memberPhone}
                        </div>
                    </div>
                    <div class="attendance-record-status">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderAttendanceStats() {
        const selectedDate = document.getElementById('attendance-date').value;
        const members = this.dataManager.loadMembers();
        
        let total = 0;
        let present = 0;
        let absent = 0;
        let late = 0;

        members.forEach(member => {
            const record = member.attendance.find(a => a.date === selectedDate);
            if (record) {
                total++;
                switch (record.status) {
                    case 'present': present++; break;
                    case 'absent': absent++; break;
                    case 'late': late++; break;
                }
            }
        });

        const rate = total > 0 ? Math.round((present / total) * 100) : 0;

        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-present').textContent = present;
        document.getElementById('stat-absent').textContent = absent;
        document.getElementById('stat-late').textContent = late;
        document.getElementById('stat-rate').textContent = rate + '%';
    }

    setupProgressTab() {
        const progressDate = document.getElementById('progress-date');
        if (progressDate) {
            progressDate.valueAsDate = new Date();
        }

        this.populateProgressClassSelect();

        const addProgressBtn = document.getElementById('add-progress');
        if (addProgressBtn && !addProgressBtn.dataset.hasListener) {
            addProgressBtn.addEventListener('click', () => this.addProgress());
            addProgressBtn.dataset.hasListener = 'true';
        }

        this.renderProgressRecords();
    }

    populateProgressClassSelect() {
        const select = document.getElementById('progress-class');
        const classes = this.dataManager.loadClasses();
        
        select.innerHTML = '<option value="">반 선택</option>' + 
            classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    addProgress() {
        const classId = parseInt(document.getElementById('progress-class').value);
        const topic = document.getElementById('progress-topic').value.trim();
        const date = document.getElementById('progress-date').value;

        if (!classId || !topic || !date) {
            alert('반, 진도 내용, 날짜를 모두 입력해주세요.');
            return;
        }

        const progress = {
            classId,
            topic,
            date,
            timestamp: Date.now()
        };

        const members = this.dataManager.loadMembers();
        const membersInClass = members.filter(m => m.classId === classId);
        
        if (membersInClass.length === 0) {
            alert('이 수강반에 구성원이 없습니다. 먼저 회원을 배정해주세요.');
            return;
        }
        
        membersInClass.forEach(member => {
            if (!member.progress) member.progress = [];
            member.progress.push({ ...progress });
        });

        this.dataManager.saveMembers(members);
        this.renderProgressRecords();
        
        document.getElementById('progress-topic').value = '';
        alert('진도가 기록되었습니다.');
    }

    renderProgressRecords() {
        const container = document.getElementById('progress-records');
        const members = this.dataManager.loadMembers();
        const classes = this.dataManager.loadClasses();
        
        let allRecords = [];
        
        members.forEach(member => {
            if (member.progress) {
                member.progress.forEach(record => {
                    allRecords.push({
                        memberName: member.name,
                        ...record
                    });
                });
            }
        });

        allRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (allRecords.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>진도 기록이 없습니다.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = allRecords.map(record => {
            const cls = classes.find(c => c.id === record.classId);
            const className = cls ? cls.name : '알 수 없는 반';
            
            return `
                <div class="progress-record">
                    <div class="record-header">
                        <div class="record-title">${record.memberName} - ${className}</div>
                        <div class="record-date">${record.date}</div>
                    </div>
                    <div class="record-content">${record.topic}</div>
                </div>
            `;
        }).join('');
    }

    setupPaymentTab() {
        const paymentDate = document.getElementById('payment-date');
        if (paymentDate) {
            paymentDate.valueAsDate = new Date();
        }

        this.populatePaymentMemberSelect();

        const addPaymentBtn = document.getElementById('add-payment');
        if (addPaymentBtn && !addPaymentBtn.dataset.hasListener) {
            addPaymentBtn.addEventListener('click', () => this.addPayment());
            addPaymentBtn.dataset.hasListener = 'true';
        }

        const filterButtons = document.querySelectorAll('.payment-list .filter-btn');
        filterButtons.forEach(btn => {
            if (!btn.dataset.hasListener) {
                btn.addEventListener('click', () => {
                    filterButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.paymentFilter = btn.dataset.filter;
                    this.renderPaymentRecords();
                });
                btn.dataset.hasListener = 'true';
            }
        });

        this.renderPaymentRecords();
    }

    addPayment() {
        const memberId = parseInt(document.getElementById('payment-member').value);
        const amount = parseInt(document.getElementById('payment-amount').value);
        const type = document.getElementById('payment-type').value;
        const date = document.getElementById('payment-date').value;

        if (!memberId || !amount || !date) {
            alert('회원, 금액, 날짜를 모두 입력해주세요.');
            return;
        }

        const payment = {
            amount,
            type,
            date,
            status: 'unpaid',
            timestamp: Date.now()
        };

        const members = this.dataManager.loadMembers();
        const memberIndex = members.findIndex(m => m.id === memberId);
        
        if (memberIndex !== -1) {
            if (!members[memberIndex].payments) members[memberIndex].payments = [];
            members[memberIndex].payments.push(payment);
            this.dataManager.saveMembers(members);
            this.renderPaymentRecords();
            this.renderMembers();
            
            document.getElementById('payment-amount').value = '';
            alert('결제가 기록되었습니다.');
        }
    }

    togglePaymentStatus(memberId, paymentIndex) {
        const members = this.dataManager.loadMembers();
        const memberIndex = members.findIndex(m => m.id === memberId);
        
        if (memberIndex !== -1) {
            const currentStatus = members[memberIndex].payments[paymentIndex].status;
            members[memberIndex].payments[paymentIndex].status = currentStatus === 'paid' ? 'unpaid' : 'paid';
            this.dataManager.saveMembers(members);
            this.renderPaymentRecords();
            this.renderMembers();
        }
    }

    populatePaymentMemberSelect() {
        const select = document.getElementById('payment-member');
        const members = this.dataManager.loadMembers();
        
        select.innerHTML = '<option value="">회원 선택</option>' + 
            members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    }

    renderPaymentRecords() {
        const container = document.getElementById('payment-records');
        const members = this.dataManager.loadMembers();
        
        let allRecords = [];
        
        members.forEach(member => {
            if (member.payments) {
                member.payments.forEach((payment, index) => {
                    allRecords.push({
                        memberId: member.id,
                        memberName: member.name,
                        paymentIndex: index,
                        ...payment
                    });
                });
            }
        });

        allRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (this.paymentFilter === 'unpaid') {
            allRecords = allRecords.filter(r => r.status === 'unpaid');
        }

        if (allRecords.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>${this.paymentFilter === 'unpaid' ? '미납 내역이 없습니다.' : '결제 내역이 없습니다.'}</p>
                </div>
            `;
            return;
        }

        const typeNames = {
            monthly: '월 회비',
            material: '교재비',
            other: '기타'
        };

        container.innerHTML = allRecords.map(record => `
            <div class="payment-record ${record.status}">
                <div class="record-header">
                    <div class="record-title">${record.memberName}</div>
                    <div class="record-date">${record.date}</div>
                </div>
                <div class="record-info">
                    <span class="record-info-item">${typeNames[record.type]}</span>
                    <span class="record-info-item">${record.amount.toLocaleString()}원</span>
                </div>
                <div class="record-actions">
                    <button class="toggle-status ${record.status}" 
                            onclick="app.togglePaymentStatus(${record.memberId}, ${record.paymentIndex})">
                        ${record.status === 'paid' ? '완료' : '미납'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    setupCounselingTab() {
        const counselingDate = document.getElementById('counseling-date');
        if (counselingDate) {
            counselingDate.valueAsDate = new Date();
        }

        this.populateCounselingMemberSelect();

        const addCounselingBtn = document.getElementById('add-counseling');
        if (addCounselingBtn && !addCounselingBtn.dataset.hasListener) {
            addCounselingBtn.addEventListener('click', () => this.addCounseling());
            addCounselingBtn.dataset.hasListener = 'true';
        }

        this.renderCounselingRecords();
    }

    setupClassesTab() {
        const addClassBtn = document.getElementById('add-class');
        if (addClassBtn && !addClassBtn.dataset.hasListener) {
            addClassBtn.addEventListener('click', () => this.addClass());
            addClassBtn.dataset.hasListener = 'true';
        }

        this.renderClassList();
    }

    addClass() {
        const name = document.getElementById('class-name').value.trim();
        const subject = document.getElementById('class-subject').value.trim();
        const teacher = document.getElementById('class-teacher').value.trim();
        const schedule = document.getElementById('class-schedule').value.trim();

        if (!name || !subject || !teacher) {
            alert('반 이름, 과목, 담당 강사는 필수 항목입니다.');
            return;
        }

        const classData = {
            name,
            subject,
            teacher,
            schedule
        };

        this.dataManager.addClass(classData);
        
        document.getElementById('class-name').value = '';
        document.getElementById('class-subject').value = '';
        document.getElementById('class-teacher').value = '';
        document.getElementById('class-schedule').value = '';
        
        this.renderClassList();
        alert('수강반이 생성되었습니다.');
    }

    deleteClass(id) {
        if (confirm('정말로 이 수강반을 삭제하시겠습니까?\n\n삭제되면 구성원의 수강반 배정도 해제됩니다.')) {
            this.dataManager.deleteClass(id);
            this.renderClassList();
            alert('수강반이 삭제되었습니다.');
        }
    }

    assignMemberToClass(classId) {
        const members = this.dataManager.loadMembers();
        const classes = this.dataManager.loadClasses();
        const cls = classes.find(c => c.id === classId);
        
        if (!cls) return;

        const availableMembers = members.filter(m => !m.classId || m.classId === classId);
        
        if (availableMembers.length === 0) {
            alert('배정할 수 있는 회원이 없습니다.');
            return;
        }

        const memberOptions = availableMembers.map(m => 
            `<option value="${m.id}">${m.name} (${m.grade ? m.grade + '학년' : '학년 미지정'})</option>`
        ).join('');

        const selectId = `assign-member-${classId}`;
        const existingSelect = document.getElementById(selectId);
        
        if (existingSelect) {
            existingSelect.remove();
            return;
        }

        const classCard = document.querySelector(`.class-card[data-id="${classId}"]`);
        const membersList = classCard.querySelector('.class-members-list');

        const assignContainer = document.createElement('div');
        assignContainer.id = selectId;
        assignContainer.className = 'assign-member-container';
        assignContainer.innerHTML = `
            <div class="assign-member-form">
                <select id="member-select-${classId}">
                    <option value="">회원 선택</option>
                    ${memberOptions}
                </select>
                <button class="btn btn-primary" onclick="app.confirmAssignMember(${classId})">추가</button>
                <button class="btn btn-secondary" onclick="app.cancelAssignMember(${classId})">취소</button>
            </div>
        `;

        membersList.insertBefore(assignContainer, membersList.firstChild);
    }

    confirmAssignMember(classId) {
        const memberId = parseInt(document.getElementById(`member-select-${classId}`).value);
        
        if (!memberId) {
            alert('회원을 선택해주세요.');
            return;
        }

        this.dataManager.assignMemberToClass(classId, memberId);
        this.renderClassList();
        alert('회원이 수강반에 배정되었습니다.');
    }

    cancelAssignMember(classId) {
        const assignContainer = document.getElementById(`assign-member-${classId}`);
        if (assignContainer) {
            assignContainer.remove();
        }
    }

    removeMemberFromClass(classId, memberId) {
        if (confirm('정말로 이 회원을 수강반에서 제외하시겠습니까?')) {
            this.dataManager.removeMemberFromClass(classId, memberId);
            this.renderClassList();
            alert('회원이 수강반에서 제외되었습니다.');
        }
    }

    renderClassList() {
        const container = document.getElementById('class-records');
        const classes = this.dataManager.loadClasses();
        const members = this.dataManager.loadMembers();

        if (classes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>등록된 수강반이 없습니다.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = classes.map(cls => {
            const classMembers = members.filter(m => m.classId === cls.id);
            
            return `
                <div class="class-card" data-id="${cls.id}">
                    <div class="class-card-header">
                        <h4>${cls.name}</h4>
                        <button class="btn btn-danger btn-sm" onclick="app.deleteClass(${cls.id})">삭제</button>
                    </div>
                    <div class="class-info">
                        <div class="class-info-item">
                            <strong>과목:</strong> ${cls.subject}
                        </div>
                        <div class="class-info-item">
                            <strong>강사:</strong> ${cls.teacher}
                        </div>
                        <div class="class-info-item">
                            <strong>시간:</strong> ${cls.schedule || '미정'}
                        </div>
                        <div class="class-info-item">
                            <strong>생성일:</strong> ${cls.createdDate}
                        </div>
                        <div class="class-info-item">
                            <strong>구성원:</strong> ${classMembers.length}명
                        </div>
                    </div>
                    <div class="class-members-list">
                        ${classMembers.length === 0 ? `
                            <div class="empty-state" style="padding: 20px 10px;">
                                <p style="font-size: 13px;">구성원이 없습니다.</p>
                            </div>
                        ` : `
                            <div class="class-members">
                                ${classMembers.map(member => `
                                    <div class="class-member-item">
                                        <span>${member.name}</span>
                                        <span>${member.grade ? member.grade + '학년' : '-'}</span>
                                        <button class="btn btn-secondary btn-sm" onclick="app.removeMemberFromClass(${cls.id}, ${member.id})">제외</button>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="app.assignMemberToClass(${cls.id})">회원 추가</button>
                </div>
            `;
        }).join('');
    }

    addCounseling() {
        const memberId = parseInt(document.getElementById('counseling-member').value);
        const date = document.getElementById('counseling-date').value;
        const type = document.getElementById('counseling-type').value;
        const content = document.getElementById('counseling-content').value.trim();
        const followUp = document.getElementById('counseling-followup').value.trim();

        if (!memberId || !date || !content) {
            alert('회원, 날짜, 상담 내용은 필수 항목입니다.');
            return;
        }

        const counseling = {
            date,
            type,
            content,
            followUp,
            timestamp: Date.now()
        };

        const members = this.dataManager.loadMembers();
        const memberIndex = members.findIndex(m => m.id === memberId);
        
        if (memberIndex !== -1) {
            if (!members[memberIndex].counseling) members[memberIndex].counseling = [];
            members[memberIndex].counseling.push(counseling);
            this.dataManager.saveMembers(members);
            this.renderCounselingRecords();
            
            document.getElementById('counseling-content').value = '';
            document.getElementById('counseling-followup').value = '';
            alert('상담 기록이 추가되었습니다.');
        }
    }

    populateCounselingMemberSelect() {
        const select = document.getElementById('counseling-member');
        const members = this.dataManager.loadMembers();
        
        select.innerHTML = '<option value="">회원 선택</option>' + 
            members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    }

    renderCounselingRecords() {
        const container = document.getElementById('counseling-records');
        const members = this.dataManager.loadMembers();
        
        let allRecords = [];
        
        members.forEach(member => {
            if (member.counseling) {
                member.counseling.forEach(record => {
                    allRecords.push({
                        memberName: member.name,
                        ...record
                    });
                });
            }
        });

        allRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (allRecords.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>상담 기록이 없습니다.</p>
                </div>
            `;
            return;
        }

        const typeNames = {
            admission: '입학 상담',
            career: '진학 상담',
            grade: '성적 상담',
            behavior: '행동 상담',
            other: '기타'
        };

        container.innerHTML = allRecords.map(record => `
            <div class="counseling-record">
                <div class="record-header">
                    <div class="record-title">
                        <span class="counseling-type-badge counseling-type-${record.type}">
                            ${typeNames[record.type]}
                        </span>
                        ${record.memberName}
                    </div>
                    <div class="record-date">${record.date}</div>
                </div>
                <div class="record-content">${record.content}</div>
                ${record.followUp ? `
                <div class="record-info">
                    <span class="record-info-item">
                        <strong>후속 조치:</strong> ${record.followUp}
                    </span>
                </div>
                ` : ''}
            </div>
        `).join('');
    }

    setupDashboard() {
        this.renderDashboard();
        this.renderDashboardCharts();
        this.renderRecentActivities();
    }

    renderDashboard() {
        const members = this.dataManager.loadMembers();
        
        const totalMembers = members.length;
        const unpaidMembers = members.filter(m => this.isUnpaid(m)).length;
        
        let totalAttendanceRate = 0;
        let attendanceCount = 0;
        
        members.forEach(member => {
            const rate = this.calculateAttendanceRate(member);
            if (rate > 0) {
                totalAttendanceRate += rate;
                attendanceCount++;
            }
        });
        
        const avgAttendanceRate = attendanceCount > 0 ? Math.round(totalAttendanceRate / attendanceCount) : 0;

        let monthlyRevenue = 0;
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        members.forEach(member => {
            if (member.payments) {
                member.payments.forEach(payment => {
                    if (payment.date.startsWith(currentMonth) && payment.status === 'paid') {
                        monthlyRevenue += payment.amount;
                    }
                });
            }
        });

        document.getElementById('dash-total-members').textContent = totalMembers;
        document.getElementById('dash-avg-attendance').textContent = avgAttendanceRate + '%';
        document.getElementById('dash-unpaid-members').textContent = unpaidMembers;
        document.getElementById('dash-monthly-revenue').textContent = monthlyRevenue.toLocaleString() + '원';
    }

    renderDashboardCharts() {
        this.renderClassChart();
        this.renderAttendanceChart();
    }

    renderClassChart() {
        const canvas = document.getElementById('classChart');
        const ctx = canvas.getContext('2d');
        
        const members = this.dataManager.loadMembers();
        const classes = this.dataManager.loadClasses();

        const classCounts = {};
        classes.forEach(cls => {
            classCounts[cls.id] = { name: cls.name, count: 0 };
        });

        members.forEach(member => {
            if (member.classId && classCounts.hasOwnProperty(member.classId)) {
                classCounts[member.classId].count++;
            }
        });

        const data = Object.entries(classCounts).map(([key, info]) => ({
            label: info.name,
            value: info.count
        }));

        if (data.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '16px sans-serif';
            ctx.fillStyle = '#718096';
            ctx.textAlign = 'center';
            ctx.fillText('등록된 수강반이 없습니다.', canvas.width / 2, canvas.height / 2);
            return;
        }

        this.drawBarChart(ctx, canvas, data);
    }

    renderAttendanceChart() {
        const canvas = document.getElementById('attendanceChart');
        const ctx = canvas.getContext('2d');
        
        const members = this.dataManager.loadMembers();
        const today = new Date();
        const last7Days = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            last7Days.push(date.toISOString().split('T')[0]);
        }

        const attendanceData = last7Days.map(date => {
            let present = 0;
            let total = 0;
            
            members.forEach(member => {
                if (member.attendance) {
                    const record = member.attendance.find(a => a.date === date);
                    if (record) {
                        total++;
                        if (record.status === 'present') present++;
                    }
                }
            });

            return {
                label: date.slice(5),
                value: total > 0 ? Math.round((present / total) * 100) : 0
            };
        });

        this.drawLineChart(ctx, canvas, attendanceData);
    }

    drawBarChart(ctx, canvas, data) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const padding = 60;
        const chartWidth = rect.width - padding * 2;
        const chartHeight = rect.height - padding * 2;
        const maxValue = Math.max(...data.map(d => d.value), 1);
        const barWidth = chartWidth / data.length - 20;

        ctx.clearRect(0, 0, rect.width, rect.height);

        const colors = ['#667eea', '#764ba2', '#48bb78', '#ecc94b'];

        data.forEach((item, index) => {
            const x = padding + index * (chartWidth / data.length) + 10;
            const barHeight = (item.value / maxValue) * chartHeight;
            const y = padding + chartHeight - barHeight;

            ctx.fillStyle = colors[index % colors.length];
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, 5);
            ctx.fill();

            ctx.fillStyle = '#2d3748';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(item.value, x + barWidth / 2, y - 5);

            ctx.fillStyle = '#718096';
            ctx.font = '11px sans-serif';
            ctx.save();
            ctx.translate(x + barWidth / 2, padding + chartHeight + 15);
            ctx.rotate(-Math.PI / 6);
            ctx.textAlign = 'right';
            ctx.fillText(item.label, 0, 0);
            ctx.restore();
        });
    }

    drawLineChart(ctx, canvas, data) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const padding = 60;
        const chartWidth = rect.width - padding * 2;
        const chartHeight = rect.height - padding * 2;

        ctx.clearRect(0, 0, rect.width, rect.height);

        const stepX = chartWidth / (data.length - 1);

        ctx.beginPath();
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        data.forEach((item, index) => {
            const x = padding + index * stepX;
            const y = padding + chartHeight - (item.value / 100) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        data.forEach((item, index) => {
            const x = padding + index * stepX;
            const y = padding + chartHeight - (item.value / 100) * chartHeight;

            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#667eea';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#2d3748';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(item.value + '%', x, y - 15);

            ctx.fillStyle = '#718096';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(item.label, x, padding + chartHeight + 20);
        });
    }

    renderRecentActivities() {
        this.renderRecentCounseling();
        this.renderRecentPayments();
    }

    renderRecentCounseling() {
        const container = document.getElementById('recent-counseling');
        const members = this.dataManager.loadMembers();
        
        let allRecords = [];
        
        members.forEach(member => {
            if (member.counseling) {
                member.counseling.forEach(record => {
                    allRecords.push({
                        memberName: member.name,
                        ...record
                    });
                });
            }
        });

        allRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const recentRecords = allRecords.slice(0, 5);

        if (recentRecords.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>최근 상담 내역이 없습니다.</p>
                </div>
            `;
            return;
        }

        const typeNames = {
            admission: '입학',
            career: '진학',
            grade: '성적',
            behavior: '행동',
            other: '기타'
        };

        container.innerHTML = `
            <div class="recent-list">
                ${recentRecords.map(record => `
                    <div class="recent-item">
                        <div class="recent-item-left">
                            <div class="recent-item-title">${record.memberName}</div>
                            <div class="recent-item-details">${typeNames[record.type]} - ${record.date}</div>
                        </div>
                        <div class="recent-item-right">
                            <div class="recent-item-date">${record.content.substring(0, 20)}...</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderRecentPayments() {
        const container = document.getElementById('recent-payments');
        const members = this.dataManager.loadMembers();
        
        let allRecords = [];
        
        members.forEach(member => {
            if (member.payments) {
                member.payments.forEach(payment => {
                    allRecords.push({
                        memberName: member.name,
                        ...payment
                    });
                });
            }
        });

        allRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const recentRecords = allRecords.slice(0, 5);

        if (recentRecords.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>최근 결제 내역이 없습니다.</p>
                </div>
            `;
            return;
        }

        const typeNames = {
            monthly: '월회비',
            material: '교재비',
            other: '기타'
        };

        container.innerHTML = `
            <div class="recent-list">
                ${recentRecords.map(record => `
                    <div class="recent-item">
                        <div class="recent-item-left">
                            <div class="recent-item-title">${record.memberName}</div>
                            <div class="recent-item-details">${typeNames[record.type]} - ${record.date}</div>
                        </div>
                        <div class="recent-item-right">
                            <div class="recent-item-amount">${record.amount.toLocaleString()}원</div>
                            <div class="recent-item-date">
                                <span class="status-badge ${record.status === 'paid' ? 'status-paid' : 'status-unpaid'}">
                                    ${record.status === 'paid' ? '완료' : '미납'}
                                </span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    setupBackupTab() {
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn && !exportBtn.dataset.hasListener) {
            exportBtn.addEventListener('click', () => this.exportData());
            exportBtn.dataset.hasListener = 'true';
        }

        const importBtn = document.getElementById('import-btn');
        if (importBtn && !importBtn.dataset.hasListener) {
            importBtn.addEventListener('click', () => this.importData());
            importBtn.dataset.hasListener = 'true';
        }

        const importFile = document.getElementById('import-file');
        if (importFile && !importFile.dataset.hasListener) {
            importFile.addEventListener('change', (e) => this.handleFileSelect(e));
            importFile.dataset.hasListener = 'true';
        }

        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn && !resetBtn.dataset.hasListener) {
            resetBtn.addEventListener('click', () => this.resetData());
            resetBtn.dataset.hasListener = 'true';
        }

        this.updateBackupInfo();
        this.renderBackupLogs();
    }

    updateBackupInfo() {
        const members = this.dataManager.loadMembers();
        const dataSize = JSON.stringify(members).length;
        const dataSizeKB = (dataSize / 1024).toFixed(2);
        
        document.getElementById('backup-member-count').textContent = members.length;
        document.getElementById('backup-size').textContent = dataSizeKB + ' KB';

        const logs = this.dataManager.getBackupLogs();
        const lastExport = logs.find(l => l.type === 'export');
        
        if (lastExport) {
            const date = new Date(lastExport.timestamp);
            const dateStr = date.toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            document.getElementById('backup-last-date').textContent = dateStr;
        } else {
            document.getElementById('backup-last-date').textContent = '없음';
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        const selectedFileSpan = document.getElementById('selected-file');
        const importBtn = document.getElementById('import-btn');

        if (file) {
            selectedFileSpan.textContent = file.name;
            selectedFileSpan.style.color = 'var(--gray-800)';
            importBtn.disabled = false;
        } else {
            selectedFileSpan.textContent = '선택된 파일 없음';
            selectedFileSpan.style.color = 'var(--gray-600)';
            importBtn.disabled = true;
        }
    }

    exportData() {
        const members = this.dataManager.loadMembers();
        
        if (members.length === 0) {
            alert('백업할 데이터가 없습니다.');
            return;
        }

        const jsonData = this.dataManager.exportData();
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `eunhu_backup_${timestamp}.json`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const logDetails = `회원 ${members.length}명`;
        this.dataManager.addBackupLog('export', logDetails);
        this.renderBackupLogs();
        this.updateBackupInfo();

        alert('백업 파일이 다운로드되었습니다.');
    }

    importData() {
        const fileInput = document.getElementById('import-file');
        const file = fileInput.files[0];

        if (!file) {
            alert('파일을 선택해주세요.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const jsonString = e.target.result;
            const result = this.dataManager.importData(jsonString);

            if (result.success) {
                const logDetails = `회원 ${result.importedCount}명`;
                this.dataManager.addBackupLog('import', logDetails);
                
                this.renderAll();
                this.renderBackupLogs();
                this.updateBackupInfo();

                alert(result.message);
                
                fileInput.value = '';
                document.getElementById('selected-file').textContent = '선택된 파일 없음';
                document.getElementById('import-btn').disabled = true;
            } else {
                alert(result.message);
            }
        };
        reader.onerror = () => {
            alert('파일 읽기 중 오류가 발생했습니다.');
        };
        reader.readAsText(file);
    }

    resetData() {
        if (confirm('정말 모든 데이터를 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.\n반드시 백업 후 진행하세요.')) {
            if (confirm('정말 삭제하시겠습니까? 이 메시지를 닫으면 취소됩니다.')) {
                const memberCount = this.dataManager.loadMembers().length;
                
                this.dataManager.resetData();
                this.dataManager.addBackupLog('reset', `회원 ${memberCount}명 삭제`);
                
                this.renderAll();
                this.renderBackupLogs();
                this.updateBackupInfo();

                alert('모든 데이터가 삭제되었습니다.');
            }
        }
    }

    renderBackupLogs() {
        const container = document.getElementById('backup-logs');
        const logs = this.dataManager.getBackupLogs();

        if (logs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>백업/복구 기록이 없습니다.</p>
                </div>
            `;
            return;
        }

        const typeNames = {
            export: '📤 데이터 백업',
            import: '📥 데이터 복구',
            reset: '🗑️ 데이터 초기화'
        };

        container.innerHTML = logs.map(log => {
            const date = new Date(log.timestamp);
            const dateStr = date.toLocaleString('ko-KR', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="log-entry ${log.type}">
                    <div class="log-entry-info">
                        <div class="log-entry-type ${log.type}">${typeNames[log.type]}</div>
                        <div class="log-entry-details">${log.details}</div>
                    </div>
                    <div class="log-entry-time">${dateStr}</div>
                </div>
            `;
        }).join('');
    }

    populateAllSelects() {
        this.populateAttendanceMemberSelect();
        this.populatePaymentMemberSelect();
        this.populateCounselingMemberSelect();
        this.populateClassSelect();
        this.populateProgressClassSelect();
    }

    renderAll() {
        this.renderMembers();
        this.renderAttendanceRecords();
        this.renderAttendanceStats();
        this.renderProgressRecords();
        this.renderPaymentRecords();
        this.renderCounselingRecords();
        this.populateAllSelects();
    }
}

const app = new App();

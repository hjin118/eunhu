class DataManager {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem('eunhu_members')) {
            localStorage.setItem('eunhu_members', JSON.stringify([]));
        }
        if (!localStorage.getItem('eunhu_attendance')) {
            localStorage.setItem('eunhu_attendance', JSON.stringify([]));
        }
        if (!localStorage.getItem('eunhu_classes')) {
            localStorage.setItem('eunhu_classes', JSON.stringify([]));
        }
        if (!localStorage.getItem('eunhu_progress')) {
            localStorage.setItem('eunhu_progress', JSON.stringify([]));
        }
        if (!localStorage.getItem('eunhu_payments')) {
            localStorage.setItem('eunhu_payments', JSON.stringify([]));
        }
        if (!localStorage.getItem('eunhu_counseling')) {
            localStorage.setItem('eunhu_counseling', JSON.stringify([]));
        }
    }

    getMembers() {
        return JSON.parse(localStorage.getItem('eunhu_members') || '[]');
    }

    addMember(member) {
        const members = this.getMembers();
        member.id = Date.now();
        member.registeredDate = new Date().toISOString().split('T')[0];
        members.push(member);
        localStorage.setItem('eunhu_members', JSON.stringify(members));
        return member;
    }

    deleteMember(id) {
        const members = this.getMembers().filter(m => m.id !== id);
        localStorage.setItem('eunhu_members', JSON.stringify(members));
    }

    getAttendance() {
        return JSON.parse(localStorage.getItem('eunhu_attendance') || '[]');
    }

    addAttendance(att) {
        const attendance = this.getAttendance();
        att.id = Date.now();
        attendance.push(att);
        localStorage.setItem('eunhu_attendance', JSON.stringify(attendance));
    }

    deleteAttendance(id) {
        const attendance = this.getAttendance().filter(a => a.id !== id);
        localStorage.setItem('eunhu_attendance', JSON.stringify(attendance));
    }

    getClasses() {
        return JSON.parse(localStorage.getItem('eunhu_classes') || '[]');
    }

    addClass(cls) {
        const classes = this.getClasses();
        cls.id = Date.now();
        cls.members = [];
        classes.push(cls);
        localStorage.setItem('eunhu_classes', JSON.stringify(classes));
    }

    addMemberToClass(classId, memberId) {
        const classes = this.getClasses();
        const cls = classes.find(c => c.id === classId);
        if (cls && !cls.members.includes(memberId)) {
            cls.members.push(memberId);
            localStorage.setItem('eunhu_classes', JSON.stringify(classes));
        }
    }

    deleteClass(id) {
        const classes = this.getClasses().filter(c => c.id !== id);
        localStorage.setItem('eunhu_classes', JSON.stringify(classes));
    }

    getProgress() {
        return JSON.parse(localStorage.getItem('eunhu_progress') || '[]');
    }

    addProgress(prog) {
        const progress = this.getProgress();
        prog.id = Date.now();
        progress.push(prog);
        localStorage.setItem('eunhu_progress', JSON.stringify(progress));
    }

    getPayments() {
        return JSON.parse(localStorage.getItem('eunhu_payments') || '[]');
    }

    addPayment(pay) {
        const payments = this.getPayments();
        pay.id = Date.now();
        pay.status = 'paid';
        payments.push(pay);
        localStorage.setItem('eunhu_payments', JSON.stringify(payments));
    }

    updatePaymentStatus(id, status) {
        const payments = this.getPayments();
        const pay = payments.find(p => p.id === id);
        if (pay) {
            pay.status = status;
            localStorage.setItem('eunhu_payments', JSON.stringify(payments));
        }
    }

    deletePayment(id) {
        const payments = this.getPayments().filter(p => p.id !== id);
        localStorage.setItem('eunhu_payments', JSON.stringify(payments));
    }

    getCounseling() {
        return JSON.parse(localStorage.getItem('eunhu_counseling') || '[]');
    }

    addCounseling(counsel) {
        const counseling = this.getCounseling();
        counsel.id = Date.now();
        counseling.push(counsel);
        localStorage.setItem('eunhu_counseling', JSON.stringify(counseling));
    }

    deleteCounseling(id) {
        const counseling = this.getCounseling().filter(c => c.id !== id);
        localStorage.setItem('eunhu_counseling', JSON.stringify(counseling));
    }
}

class App {
    constructor() {
        this.dataManager = new DataManager();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderAll();
    }

    setupEventListeners() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e));
        });

        document.getElementById('member-form').addEventListener('submit', (e) => this.handleMemberSubmit(e));
        document.getElementById('class-form').addEventListener('submit', (e) => this.handleClassSubmit(e));
        document.getElementById('save-attendance').addEventListener('click', () => this.saveAttendance());
        document.getElementById('save-progress').addEventListener('click', () => this.saveProgress());
        document.getElementById('save-payment').addEventListener('click', () => this.savePayment());
        document.getElementById('save-counseling').addEventListener('click', () => this.saveCounseling());

        document.getElementById('attendance-date').valueAsDate = new Date();
        document.getElementById('progress-date').valueAsDate = new Date();
        document.getElementById('payment-date').valueAsDate = new Date();
        document.getElementById('counseling-date').valueAsDate = new Date();
    }

    switchTab(e) {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        
        e.target.classList.add('active');
        const tabId = e.target.dataset.tab + '-tab';
        document.getElementById(tabId).classList.add('active');
        
        this.renderAll();
    }

    renderAll() {
        this.renderMembers();
        this.renderAttendance();
        this.renderClasses();
        this.renderProgress();
        this.renderPayments();
        this.renderCounseling();
        this.populateSelects();
    }

    renderMembers() {
        const tbody = document.querySelector('#members-table tbody');
        const members = this.dataManager.getMembers();
        tbody.innerHTML = members.map(m => `
            <tr>
                <td>${m.name}</td>
                <td>${m.phone}</td>
                <td>${m.school || '-'}</td>
                <td>${m.grade || '-'}학년</td>
                <td>${m.registeredDate}</td>
                <td><button class="btn btn-danger" onclick="app.deleteMember(${m.id})">삭제</button></td>
            </tr>
        `).join('');
    }

    renderAttendance() {
        const tbody = document.querySelector('#attendance-table tbody');
        const attendance = this.dataManager.getAttendance();
        const members = this.dataManager.getMembers();
        tbody.innerHTML = attendance.map(a => {
            const member = members.find(m => m.id === a.memberId);
            const statusClass = `status-${a.status}`;
            const statusText = { present: '출석', absent: '결석', late: '지각' }[a.status];
            return `
                <tr>
                    <td>${a.date}</td>
                    <td>${member ? member.name : '알 수 없음'}</td>
                    <td class="${statusClass}">${statusText}</td>
                    <td><button class="btn btn-danger" onclick="app.deleteAttendance(${a.id})">삭제</button></td>
                </tr>
            `;
        }).join('');
    }

    renderClasses() {
        const container = document.getElementById('class-list');
        const classes = this.dataManager.getClasses();
        const members = this.dataManager.getMembers();
        container.innerHTML = classes.map(c => {
            const classMembers = c.members.map(mid => members.find(m => m.id === mid)?.name).filter(Boolean);
            return `
                <div class="class-card">
                    <h3>${c.name} <button class="btn btn-danger" onclick="app.deleteClass(${c.id})">삭제</button></h3>
                    <div class="class-info">
                        <span><strong>과목:</strong> ${c.subject}</span>
                        <span><strong>강사:</strong> ${c.teacher}</span>
                        <span><strong>시간:</strong> ${c.schedule}</span>
                    </div>
                    <div class="member-select">
                        <select id="class-${c.id}-member-select">
                            <option value="">회원 추가</option>
                            ${members.filter(m => !c.members.includes(m.id)).map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                        </select>
                        <button class="btn btn-primary" onclick="app.addMemberToClass(${c.id})">추가</button>
                    </div>
                    <div style="margin-top: 10px;">
                        <strong>구성원:</strong> ${classMembers.length ? classMembers.join(', ') : '없음'}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderProgress() {
        const container = document.getElementById('progress-list');
        const progress = this.dataManager.getProgress();
        const classes = this.dataManager.getClasses();
        container.innerHTML = progress.map(p => {
            const cls = classes.find(c => c.id === p.classId);
            return `
                <div class="progress-card">
                    <h3>${cls ? cls.name : '알 수 없는 반'}</h3>
                    <div class="progress-info">
                        <span><strong>날짜:</strong> ${p.date}</span>
                        <span><strong>진도:</strong> ${p.topic}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderPayments() {
        const tbody = document.querySelector('#payment-table tbody');
        const payments = this.dataManager.getPayments();
        const members = this.dataManager.getMembers();
        tbody.innerHTML = payments.map(p => {
            const member = members.find(m => m.id === p.memberId);
            const typeText = { monthly: '월 회비', material: '교재비', other: '기타' }[p.type];
            const statusText = { paid: '완료', pending: '미납' }[p.status];
            const statusClass = p.status === 'paid' ? 'status-present' : 'status-absent';
            return `
                <tr>
                    <td>${p.date}</td>
                    <td>${member ? member.name : '알 수 없음'}</td>
                    <td>${typeText}</td>
                    <td>${p.amount.toLocaleString()}원</td>
                    <td class="${statusClass}">${statusText}</td>
                    <td>
                        <button class="btn btn-danger" onclick="app.deletePayment(${p.id})">삭제</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderCounseling() {
        const container = document.getElementById('counseling-list');
        const counseling = this.dataManager.getCounseling();
        const members = this.dataManager.getMembers();
        const typeText = { admission: '입학 상담', career: '진학 상담', grade: '성적 상담', behavior: '행동 상담', other: '기타' };
        const typeColors = { admission: '#e53e3e', career: '#667eea', grade: '#ecc94b', behavior: '#48bb78', other: '#718096' };
        
        container.innerHTML = counseling.slice().reverse().map(c => {
            const member = members.find(m => m.id === c.memberId);
            const color = typeColors[c.type] || '#718096';
            return `
                <div class="counseling-card">
                    <div class="counseling-header">
                        <h3>${member ? member.name : '알 수 없음'} - ${c.date}</h3>
                        <span class="counseling-type" style="background: ${color};">${typeText[c.type] || '기타'}</span>
                        <button class="btn btn-danger" onclick="app.deleteCounseling(${c.id})">삭제</button>
                    </div>
                    <div class="counseling-content">
                        <strong>내용:</strong> ${c.content}
                    </div>
                    ${c.followUp ? `
                    <div class="counseling-content">
                        <strong>후속 조치:</strong> ${c.followUp}
                    </div>
                    ` : ''}
                    ${c.nextDate ? `
                    <div class="counseling-content">
                        <strong>다음 상담일:</strong> ${c.nextDate}
                    </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    populateSelects() {
        const members = this.dataManager.getMembers();
        const classes = this.dataManager.getClasses();

        const attendanceSelect = document.getElementById('attendance-member');
        attendanceSelect.innerHTML = '<option value="">회원 선택</option>' + 
            members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

        const progressClassSelect = document.getElementById('progress-class');
        progressClassSelect.innerHTML = '<option value="">반 선택</option>' + 
            classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

        const paymentMemberSelect = document.getElementById('payment-member');
        paymentMemberSelect.innerHTML = '<option value="">회원 선택</option>' + 
            members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

        const counselingMemberSelect = document.getElementById('counseling-member');
        counselingMemberSelect.innerHTML = '<option value="">회원 선택</option>' + 
            members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    }

    handleMemberSubmit(e) {
        e.preventDefault();
        const member = {
            name: document.getElementById('member-name').value,
            phone: document.getElementById('member-phone').value,
            school: document.getElementById('member-school').value,
            grade: document.getElementById('member-grade').value
        };
        this.dataManager.addMember(member);
        document.getElementById('member-form').reset();
        this.renderAll();
    }

    deleteMember(id) {
        if (confirm('정말 삭제하시겠습니까?')) {
            this.dataManager.deleteMember(id);
            this.renderAll();
        }
    }

    saveAttendance() {
        const date = document.getElementById('attendance-date').value;
        const memberId = parseInt(document.getElementById('attendance-member').value);
        const status = document.getElementById('attendance-status').value;

        if (!date || !memberId) {
            alert('날짜와 회원을 선택해주세요.');
            return;
        }

        this.dataManager.addAttendance({ date, memberId, status });
        this.renderAttendance();
    }

    deleteAttendance(id) {
        if (confirm('정말 삭제하시겠습니까?')) {
            this.dataManager.deleteAttendance(id);
            this.renderAttendance();
        }
    }

    handleClassSubmit(e) {
        e.preventDefault();
        const cls = {
            name: document.getElementById('class-name').value,
            subject: document.getElementById('class-subject').value,
            teacher: document.getElementById('class-teacher').value,
            schedule: document.getElementById('class-schedule').value
        };
        this.dataManager.addClass(cls);
        document.getElementById('class-form').reset();
        this.renderAll();
    }

    addMemberToClass(classId) {
        const select = document.getElementById(`class-${classId}-member-select`);
        const memberId = parseInt(select.value);
        if (memberId) {
            this.dataManager.addMemberToClass(classId, memberId);
            this.renderClasses();
        }
    }

    deleteClass(id) {
        if (confirm('정말 삭제하시겠습니까?')) {
            this.dataManager.deleteClass(id);
            this.renderAll();
        }
    }

    saveProgress() {
        const classId = parseInt(document.getElementById('progress-class').value);
        const topic = document.getElementById('progress-topic').value;
        const date = document.getElementById('progress-date').value;

        if (!classId || !topic || !date) {
            alert('반, 진도 내용, 날짜를 모두 입력해주세요.');
            return;
        }

        this.dataManager.addProgress({ classId, topic, date });
        document.getElementById('progress-topic').value = '';
        this.renderProgress();
    }

    savePayment() {
        const memberId = parseInt(document.getElementById('payment-member').value);
        const amount = parseInt(document.getElementById('payment-amount').value);
        const type = document.getElementById('payment-type').value;
        const date = document.getElementById('payment-date').value;

        if (!memberId || !amount || !date) {
            alert('회원, 금액, 날짜를 모두 입력해주세요.');
            return;
        }

        this.dataManager.addPayment({ memberId, amount, type, date });
        document.getElementById('payment-amount').value = '';
        this.renderPayments();
    }

    deletePayment(id) {
        if (confirm('정말 삭제하시겠습니까?')) {
            this.dataManager.deletePayment(id);
            this.renderPayments();
        }
    }

    saveCounseling() {
        const memberId = parseInt(document.getElementById('counseling-member').value);
        const date = document.getElementById('counseling-date').value;
        const type = document.getElementById('counseling-type').value;
        const content = document.getElementById('counseling-content').value;
        const followUp = document.getElementById('counseling-followup').value;
        const nextDate = document.getElementById('counseling-next-date').value;

        if (!memberId || !date || !content) {
            alert('회원, 날짜, 상담 내용은 필수입니다.');
            return;
        }

        this.dataManager.addCounseling({ memberId, date, type, content, followUp, nextDate });
        document.getElementById('counseling-content').value = '';
        document.getElementById('counseling-followup').value = '';
        document.getElementById('counseling-next-date').value = '';
        this.renderCounseling();
    }

    deleteCounseling(id) {
        if (confirm('정말 삭제하시겠습니까?')) {
            this.dataManager.deleteCounseling(id);
            this.renderCounseling();
        }
    }
}

const app = new App();

package iuh.fit.backend.config;

import iuh.fit.backend.appointment.repository.AppointmentRepository;
import iuh.fit.backend.patient.entity.Patient;
import iuh.fit.backend.patient.entity.Review;
import iuh.fit.backend.patient.repository.PatientRepository;
import iuh.fit.backend.patient.repository.ReviewRepository;
import iuh.fit.backend.treatment.entity.Service;
import iuh.fit.backend.treatment.repository.ServiceRepository;
import iuh.fit.backend.user.entity.Dentist;
import iuh.fit.backend.user.entity.User;
import iuh.fit.backend.user.enums.Role;
import iuh.fit.backend.user.enums.StatusUser;
import iuh.fit.backend.user.repository.DentistRepository;
import iuh.fit.backend.user.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DentistRepository dentistRepository;
    private final ServiceRepository serviceRepository;
    private final PatientRepository patientRepository;
    private final ReviewRepository reviewRepository;

    public DataInitializer(UserRepository userRepository,
                           DentistRepository dentistRepository,
                           ServiceRepository serviceRepository,
                           PatientRepository patientRepository,
                           ReviewRepository reviewRepository) {
        this.userRepository = userRepository;
        this.dentistRepository = dentistRepository;
        this.serviceRepository = serviceRepository;
        this.patientRepository = patientRepository;
        this.reviewRepository = reviewRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // Initialize services if database is empty
        if (serviceRepository.count() == 0) {
            System.out.println("Initializing sample services...");
            Service invisalign = Service.builder()
                    .serviceName("Niềng răng Invisalign")
                    .description("Niềng răng khay trong suốt Invisalign nhập khẩu trực tiếp từ Mỹ. Lộ trình điều trị cá nhân hóa bằng phần mềm ClinCheck 3D.")
                    .price(new BigDecimal("80000000"))
                    .build();

            Service veneer = Service.builder()
                    .serviceName("Răng sứ Veneer")
                    .description("Mặt dán sứ Veneer siêu mỏng bảo tồn tối đa răng thật. Đem lại nụ cười rạng rỡ, tự nhiên và bền bỉ theo thời gian.")
                    .price(new BigDecimal("6000000"))
                    .build();

            Service implant = Service.builder()
                    .serviceName("Trồng răng Implant")
                    .description("Cấy ghép Implant phục hồi răng mất hoàn hảo cả chân răng và thân răng. Đảm bảo ăn nhai như răng thật và tính thẩm mỹ cao.")
                    .price(new BigDecimal("18000000"))
                    .build();

            Service general = Service.builder()
                    .serviceName("Khám răng tổng quát")
                    .description("Thăm khám định kỳ, làm sạch cao răng, điều trị sâu răng và chăm sóc sức khỏe răng miệng định kỳ cho cả gia đình.")
                    .price(new BigDecimal("200000"))
                    .build();

            Service whitening = Service.builder()
                    .serviceName("Tẩy trắng răng")
                    .description("Công nghệ tẩy trắng răng Zoom Laser thế hệ mới, an toàn cho men răng và nâng tông nhanh chóng chỉ trong 45 phút.")
                    .price(new BigDecimal("2500000"))
                    .build();

            Service wisdom = Service.builder()
                    .serviceName("Nhổ răng khôn")
                    .description("Nhổ răng khôn không đau bằng máy siêu âm Piezotome, hỗ trợ lành thương nhanh, hạn chế sưng nề tối đa.")
                    .price(new BigDecimal("1500000"))
                    .build();

            serviceRepository.saveAll(List.of(invisalign, veneer, implant, general, whitening, wisdom));
        }

        // Initialize dentists if empty
        if (dentistRepository.count() == 0) {
            System.out.println("Initializing sample dentists...");

            // Dentist 1
            User u1 = User.builder()
                    .username("phuong_nguyen")
                    .password("123456")
                    .email("phuong.nguyen@crown.vn")
                    .phone("0912345678")
                    .avatarUrl("https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300")
                    .role(Role.DENTIST)
                    .status(StatusUser.ACTIVE)
                    .build();
            userRepository.save(u1);

            Dentist d1 = Dentist.builder()
                    .user(u1)
                    .fullName("ThS. BS. Nguyễn Thị Phương")
                    .licenseNumber("12345/BYT-CCHN")
                    .specialization("Chỉnh nha Invisalign & Niềng răng mắc cài")
                    .experienceYears(12)
                    .qualification("Thạc sĩ Răng Hàm Mặt - Đại học Y Hà Nội, Chứng chỉ Invisalign Platinum")
                    .build();
            dentistRepository.save(d1);

            // Dentist 2
            User u2 = User.builder()
                    .username("anh_nguyen")
                    .password("123456")
                    .email("anh.nguyen@crown.vn")
                    .phone("0987654321")
                    .avatarUrl("https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300")
                    .role(Role.DENTIST)
                    .status(StatusUser.ACTIVE)
                    .build();
            userRepository.save(u2);

            Dentist d2 = Dentist.builder()
                    .user(u2)
                    .fullName("BS. Nguyễn Tuấn Anh")
                    .licenseNumber("67890/BYT-CCHN")
                    .specialization("Thẩm mỹ răng sứ Veneer & Phục hình răng")
                    .experienceYears(8)
                    .qualification("Tốt nghiệp Bác sĩ Răng Hàm Mặt - Đại học Y Dược TP.HCM")
                    .build();
            dentistRepository.save(d2);

            // Dentist 3
            User u3 = User.builder()
                    .username("mai_le")
                    .password("123456")
                    .email("mai.le@crown.vn")
                    .phone("0905556677")
                    .avatarUrl("https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300")
                    .role(Role.DENTIST)
                    .status(StatusUser.ACTIVE)
                    .build();
            userRepository.save(u3);

            Dentist d3 = Dentist.builder()
                    .user(u3)
                    .fullName("BS. Lê Thị Mai")
                    .licenseNumber("54321/BYT-CCHN")
                    .specialization("Cấy ghép Implant & Phẫu thuật trong miệng")
                    .experienceYears(10)
                    .qualification("Chứng chỉ Implant quốc tế ICOI, Bác sĩ chuyên khoa I ĐH Y Hà Nội")
                    .build();
            dentistRepository.save(d3);
        }

        // Initialize reviews if empty
        if (reviewRepository.count() == 0) {
            System.out.println("Initializing sample reviews...");

            // Create patient 1
            User pu1 = User.builder()
                    .username("tam_le")
                    .password("123456")
                    .email("tam.le@gmail.com")
                    .phone("0901234567")
                    .role(Role.PATIENT)
                    .status(StatusUser.ACTIVE)
                    .build();
            userRepository.save(pu1);

            Patient p1 = Patient.builder()
                    .user(pu1)
                    .fullName("Lê Minh Tâm")
                    .patientCode("PA-001")
                    .createdAt(LocalDateTime.now())
                    .build();
            patientRepository.save(p1);

            Review r1 = Review.builder()
                    .patient(p1)
                    .rating(5)
                    .comment("Trải nghiệm niềng răng Invisalign ở Crown rất tuyệt vời. Bác sĩ nhiệt tình, phòng khám sạch sẽ và trang thiết bị rất hiện đại.")
                    .build();
            reviewRepository.save(r1);

            // Create patient 2
            User pu2 = User.builder()
                    .username("thao_tran")
                    .password("123456")
                    .email("thao.tran@gmail.com")
                    .phone("0907654321")
                    .role(Role.PATIENT)
                    .status(StatusUser.ACTIVE)
                    .build();
            userRepository.save(pu2);

            Patient p2 = Patient.builder()
                    .user(pu2)
                    .fullName("Trần Thu Thảo")
                    .patientCode("PA-002")
                    .createdAt(LocalDateTime.now())
                    .build();
            patientRepository.save(p2);

            Review r2 = Review.builder()
                    .patient(p2)
                    .rating(5)
                    .comment("Dịch vụ bọc răng sứ Veneer chất lượng rất tốt, tôi ăn uống hoàn toàn bình thường, nụ cười tự nhiên lắm. Rất cảm ơn đội ngũ bác sĩ!")
                    .build();
            reviewRepository.save(r2);

            // Create patient 3
            User pu3 = User.builder()
                    .username("tuan_hoang")
                    .password("123456")
                    .email("tuan.hoang@gmail.com")
                    .phone("0909998888")
                    .role(Role.PATIENT)
                    .status(StatusUser.ACTIVE)
                    .build();
            userRepository.save(pu3);

            Patient p3 = Patient.builder()
                    .user(pu3)
                    .fullName("Hoàng Anh Tuấn")
                    .patientCode("PA-003")
                    .createdAt(LocalDateTime.now())
                    .build();
            patientRepository.save(p3);

            Review r3 = Review.builder()
                    .patient(p3)
                    .rating(5)
                    .comment("Tôi đã làm 2 răng Implant tại đây, quy trình phẫu thuật rất nhẹ nhàng và nhanh chóng. Bác sĩ có tay nghề rất cao.")
                    .build();
            reviewRepository.save(r3);
        }
    }
}

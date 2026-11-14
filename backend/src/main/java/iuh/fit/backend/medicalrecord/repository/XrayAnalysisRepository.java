package iuh.fit.backend.medicalrecord.repository;

import iuh.fit.backend.medicalrecord.entity.XrayAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface XrayAnalysisRepository extends JpaRepository<XrayAnalysis, UUID> {

    List<XrayAnalysis> findByXrayImageIdOrderByAnalyzedAtDesc(UUID xrayImageId);
}


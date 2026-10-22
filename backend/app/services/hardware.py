import os
import platform
import subprocess
import psutil
from typing import Optional
from app.models.schemas import SystemSpecs, CpuInfo, GpuInfo

def detect_nvidia_gpu() -> Optional[GpuInfo]:
    """Inspect system for NVIDIA GPU using nvidia-smi."""
    try:
        # Run nvidia-smi query
        cmd = [
            "nvidia-smi",
            "--query-gpu=name,memory.total,memory.free,driver_version",
            "--format=csv,noheader,nounits"
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        if result.returncode == 0 and result.stdout.strip():
            line = result.stdout.strip().splitlines()[0]
            parts = [p.strip() for p in line.split(",")]
            if len(parts) >= 4:
                gpu_name = parts[0]
                total_mb = int(parts[1])
                free_mb = int(parts[2])
                driver = parts[3]
                return GpuInfo(
                    name=gpu_name,
                    vram_total_mb=total_mb,
                    vram_free_mb=free_mb,
                    cuda_available=True,
                    driver_version=driver
                )
    except Exception:
        pass
    
    # Check if ctranslate2 can detect CUDA
    try:
        import ctranslate2
        if ctranslate2.get_cuda_device_count() > 0:
            return GpuInfo(
                name="NVIDIA CUDA Compatible GPU",
                vram_total_mb=4096,
                cuda_available=True
            )
    except Exception:
        pass

    return None

def detect_cpu_info() -> CpuInfo:
    """Detect CPU details and total RAM."""
    cpu_name = platform.processor() or "Multi-core Processor"
    # On Windows, try to get friendly processor name
    try:
        if platform.system() == "Windows":
            out = subprocess.run(
                ["powershell", "-Command", "(Get-CimInstance Win32_Processor).Name"],
                capture_output=True, text=True, timeout=4
            )
            if out.returncode == 0 and out.stdout.strip():
                cpu_name = out.stdout.strip().splitlines()[0]
    except Exception:
        pass

    cores = psutil.cpu_count(logical=False) or 4
    threads = psutil.cpu_count(logical=True) or 8
    ram_gb = round(psutil.virtual_memory().total / (1024 ** 3), 1)

    return CpuInfo(
        name=cpu_name,
        physical_cores=cores,
        logical_threads=threads,
        ram_total_gb=ram_gb
    )

def get_system_specs() -> SystemSpecs:
    """Analyze hardware and recommend optimal AI tier and compute device."""
    cpu = detect_cpu_info()
    gpu = detect_nvidia_gpu()
    has_nvidia = gpu is not None and gpu.cuda_available

    if has_nvidia and gpu.vram_total_mb >= 4000:
        recommended_tier = "large"
        recommended_device = "cuda"
        reason = f"Detected {gpu.name} ({gpu.vram_total_mb // 1024}GB VRAM). Large tier with CUDA offers the highest multilingual accuracy and near-instant processing."
    elif has_nvidia:
        recommended_tier = "medium"
        recommended_device = "cuda"
        reason = f"Detected {gpu.name}. Medium tier with CUDA provides balanced speed and memory efficiency."
    elif cpu.ram_total_gb >= 16:
        recommended_tier = "medium"
        recommended_device = "cpu"
        reason = f"16GB+ RAM detected on {cpu.physical_cores}-core CPU. Medium tier with INT8 quantization provides great accuracy and stability."
    else:
        recommended_tier = "small"
        recommended_device = "cpu"
        reason = f"Small tier with INT8 CPU quantization recommended for smooth, lightweight processing with minimal RAM usage (~300MB)."

    return SystemSpecs(
        cpu=cpu,
        gpu=gpu,
        has_nvidia=has_nvidia,
        recommended_tier=recommended_tier,
        recommended_device=recommended_device,
        recommendation_reason=reason
    )

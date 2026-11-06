use crate::model::DisplayInfo;

/// Stable id for a set of displays: device identity, resolution, scale, primary
/// flag, and position in the virtual desktop. Display order does not matter.
pub fn configuration_id(displays: &[DisplayInfo]) -> String {
    let mut parts: Vec<String> = displays
        .iter()
        .map(|display| {
            let identity = if display.device_id.is_empty() {
                &display.id
            } else {
                &display.device_id
            };
            format!(
                "{}|{}x{}|{}|{}|{},{}",
                identity.to_ascii_lowercase(),
                display.width,
                display.height,
                (display.scale_factor * 100.0).round() as u32,
                u8::from(display.primary),
                display.x,
                display.y,
            )
        })
        .collect();
    parts.sort_unstable();

    format!("cfg-{:016x}", fnv1a64(parts.join(";").as_bytes()))
}

/// FNV-1a keeps the id identical across builds and Rust versions, unlike the
/// std hasher.
fn fnv1a64(bytes: &[u8]) -> u64 {
    const OFFSET: u64 = 0xcbf2_9ce4_8422_2325;
    const PRIME: u64 = 0x0000_0100_0000_01b3;

    bytes.iter().fold(OFFSET, |hash, byte| {
        (hash ^ u64::from(*byte)).wrapping_mul(PRIME)
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn display(device_id: &str, x: i32, width: u32, scale: f64, primary: bool) -> DisplayInfo {
        DisplayInfo {
            id: format!("\\\\.\\DISPLAY{}", if primary { 1 } else { 2 }),
            device_id: device_id.to_string(),
            name: String::new(),
            x,
            y: 0,
            width,
            height: 1440,
            scale_factor: scale,
            primary,
        }
    }

    #[test]
    fn display_order_does_not_change_the_id() {
        let left = display("MON#A", 0, 2560, 1.0, true);
        let right = display("MON#B", 2560, 1920, 1.25, false);

        assert_eq!(
            configuration_id(&[left.clone(), right.clone()]),
            configuration_id(&[right, left])
        );
    }

    #[test]
    fn resolution_scale_and_arrangement_change_the_id() {
        let base = [display("MON#A", 0, 2560, 1.0, true)];
        let id = configuration_id(&base);

        let mut resized = base.clone();
        resized[0].width = 1920;
        let mut scaled = base.clone();
        scaled[0].scale_factor = 1.5;
        let docked = [base[0].clone(), display("MON#B", 2560, 1920, 1.0, false)];
        let moved = [base[0].clone(), display("MON#B", -1920, 1920, 1.0, false)];

        let ids = [
            configuration_id(&resized),
            configuration_id(&scaled),
            configuration_id(&docked),
            configuration_id(&moved),
        ];
        assert!(ids.iter().all(|other| other != &id));
        assert_ne!(ids[2], ids[3]);
    }

    #[test]
    fn legacy_displays_fall_back_to_the_adapter_name() {
        let mut legacy = display("", 0, 2560, 1.0, true);
        let first = configuration_id(std::slice::from_ref(&legacy));
        legacy.id = "\\\\.\\DISPLAY3".to_string();

        assert_ne!(first, configuration_id(&[legacy]));
    }
}
